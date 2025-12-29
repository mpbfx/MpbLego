import { MongoClient, FindOptions, ObjectId, UpdateFilter, Filter } from 'mongodb'
const url = "mongodb://localhost:27017/"
const client = new MongoClient(url)
const records = [
  {
    name: 'Westbrook',
    age: 32
  },
  {
    name: 'Howard',
    age: 35
  },  
]    
async function run() {
  try {
    await client.connect()
    const db = client.db('hello')
    const res = await db.command({ ping: 1 })
    console.log('connected', res)
    const teamCollection = db.collection('team')
    const userCollection = db.collection('user')
    // const lakerTeam = await teamCollection.findOne({ name: 'Lakers'})
    // const players = await userCollection.find({ team: lakerTeam._id }).toArray()
    // console.log(players)
    // const netTeam = await teamCollection.findOne({ name: 'Nets'})
    // const netPlayers = await userCollection.find({ _id: { "$in": netTeam.players }}).toArray()
    // console.log(netPlayers)
    // 
    // const pipeLine = [
    //   { $match: { age: { $gt: 30 }}},
    //   { $group: { _id: "$team", total: { $sum: "$age"}, count: { $sum: 1 }, avg: { $avg: "$age"}}},
    //   { $sort: { total: 1 }}
    // ]
    // const results = await userCollection.aggregate(pipeLine).toArray()
    // console.log(results)
    const pipeLine = [
      { $match: { name: 'Nets'} },
      {
        $lookup: {
          from: 'user',
          localField: 'players',
          foreignField: '_id',
          as: "newPlayers"
        }
      }
    ]
    const teamWithPlayers = await teamCollection.aggregate(pipeLine).toArray()
    console.log(teamWithPlayers[0])
    const pipeLine2 = [
      {
        $match: { team: { $exists: true }}
      },
      {
        $lookup: {
          from: 'team',
          localField: 'team',
          foreignField: '_id',
          as: "team"
        }
      }
    ]
    const playerWithTeam = await userCollection.aggregate(pipeLine2).toArray()
    console.log(playerWithTeam[0])
  } catch(e) {
    console.error(e)
  } finally {
    await client.close()
  }
}

run()