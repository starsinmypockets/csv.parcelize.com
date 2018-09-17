module.exports = {
  trainingData: [
    {
      "pos": [
        {
          name: "A good time was had",
          description: "We will have a very good time",
          address: "1234 street street"
        },
        {
          name: "The best, perfect great",
          description: "I can't believe how great it is it is the best",
          address: "Shouldn't count"
        },
        {
          name: "Go get em champ",
          description: "Believe me, you'll do great. I'm counting you and I believe in you.",
          address: "99 Top of the world"
        }
      ]
    },
    {
      "neg": [
        {
          name: "Boo this sucks",
          description: "Wah I hate this party it is the worst",
          address: "2345 newstreet"
        },
        {
          name: "Another bad one",
          description: "I can't imagine anything worse than this dang ti's terrible",
          address: "house boat"
        },
        {
          name: "This sucks but contains an exception",
          description: "Everything about this item is terrible except for the word exception",
          address: "Starship Enterprise, holodeck"
        }
      ]
    }
  ],
  testData: [
    {
      name: "This is definitely good",
      description: "Everything good very very great happy foo lalala",
      other: "foo bar ignore bad terrible sucks",
      cat: "pos"
    },
    {
      name: "Test one that sucks",
      description: "Bad terrible sucks",
      cat: "neg"
    }
  ],
  dataFields: ['name', 'description']
}
