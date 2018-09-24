const jwt = require('jsonwebtoken')
const _ = require('lodash')

function authorizeUser(userScopes, methodArn) {
  const hasValidScope = _.some(userScopes, scope => _.endsWith(methodArn, scope))
  return hasValidScope
}

function buildIAMPolicy (userId, effect, resource, context) {
  const policy = {
    principalId: userId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        },
      ],
    },
    context,
  }

  return policy
}

module.exports.handler = (event, context, callback) => {
  const token = event.authorization

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = decoded.user
    const isAllowed = authorizeUser(user.scopes, event.methodArn)

    const effect = isAllowed ? 'Allow' : 'Deny'
    const userId = user.username
    const authorizerContext = { user: JSON.stringify(user) }
    const policyDocument = buildIAMPolicy(userId, effect, event.methodArn, authorizerContext)

    callback(null, policyDocument)
  } catch (e) {
		callback('Unauthorized') 
  }
}
