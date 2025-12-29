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
    // 数据的插入
    const userCollection = db.collection<{ hobbies: string[]}>('user')
    // const result = await userCollection.insertOne({ name: 'AD', age: 28 })
    // console.log(result)
    // const results = await userCollection.insertMany(records)
    // console.log(results)
    // 查找
    // const result = await userCollection.findOne({ name: 'james' })
    // console.log('the result', result)
    const cursor = userCollection.find()
    // 1 使用 forEach
    // await cursor.forEach(doc => console.log(doc))
    // 2 使用 toArray()
    // const results = await userCollection.find().toArray()
    // console.log('the result array', results)
    // 1 比较操作符
    // const results = await userCollection.find({ age: { $lt: 30 }}).toArray()
    // 2 逻辑操作符
    // const condition = {
    //   $or: [
    //     { age: { $gt: 30 }},
    //     { name: 'xiaobao' }
    //   ]
    // }
    // const results = await userCollection.find(condition).toArray()
    //3 element
    // const results = await userCollection.find({ hobby: { $exists: true }}).toArray()
    // const results = await userCollection.find({ age: { $type: 'number' }}).toArray()
    // console.log('the result array', results)
    // limit
    const options: FindOptions = {
      // limit: 2,
      // skip: 4
      // sort: { age: -1 }
      projection: { name: 1 }
    }
    // const results = await userCollection.find({ age: { $type: 'number' }}, options).toArray()
    // console.log('the result array', results)
    // replace - put
    // update - patch 
    // const replaceDoc = await userCollection.replaceOne({ name: 'james' }, { name: 'LBJ', age: 40 })
    // console.log(replaceDoc)
    // const updateFilter: UpdateFilter<{ name: string, age: number }> = {
    //   $set: {
    //     name: 'Lebron'
    //   },
    //   $inc: {
    //     age: 1
    //   }
    // }
    // update array result
    // const updateFilter: UpdateFilter<{ name: string, age: number, hobbies: string[] }> = {
    //   $set: {
    //     "hobbies.0": 'golf'
    //   },
    // }
    // const updateDoc = await userCollection.updateOne({ _id: new ObjectId('6153d382be72255729c75b7d')}, updateFilter)
    // console.log(updateDoc)
    // search by array element
    // const result = await userCollection.findOne({
    //   hobbies: { $regex: /gol/g }
    // })
    // console.log(result)
    // update array item by search result $
    // const updateFilter: UpdateFilter<{ name: string, age: number, hobbies: string[] }> = {
    //   $set: {
    //     "hobbies.$": 'golf-new'
    //   },
    // }
    // const indexArray = await userCollection.listIndexes().toArray()
    // const updateDoc = await userCollection.updateOne({ 
    //   _id: new ObjectId('6153d382be72255729c75b7d'),
    //   hobbies: 'xyz'
    // }, updateFilter)
    // 索引 mongoDB index
    // let testArr = []
    // for(let i = 1; i<= 50000; i++) {
    //   testArr.push({ type: 'test', name: `test${i}`, age: i})
    // }
    // const result = await userCollection.insertMany(testArr)
    // const result = await userCollection.find({ name: 'test50000'}).explain()
    // const result = await userCollection.find({ _id: new ObjectId('615c1d058dfd4a491e810d0a')}).explain()
    // const result = await userCollection.createIndex({ name: 1 })
    //console.log(result)
    const indexResult = await userCollection.listIndexes().toArray()
    console.log(indexResult)
    // const dropResult = await userCollection.dropIndex('name_1')
    // console.log(dropResult)
  } catch(e) {
    console.error(e)
  } finally {
    await client.close()
  }
}

run()