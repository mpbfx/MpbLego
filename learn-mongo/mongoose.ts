import { connect, Schema, model, disconnect } from 'mongoose'
async function main() {
  try {
    await connect('mongodb://localhost:27017/hello')
    console.log('[egg-mongoose] connected successfully')
    // const ProdcutSchema = new Schema({
    //   name: { type: String },
    //   price: { type: Number }
    // })
    // const ProductModel = model('Product', ProdcutSchema)
    // const result = await ProductModel.create({
    //   name: 'cellphone',
    //   price: 1300
    // })
    // const ipad = new ProductModel({
    //   name: 'ipad',
    //   price: 4000,
    //   age: 20      
    // })
    // await ipad.save()
    // console.log(result)
    const UserSchema = new Schema({
      name: { type: String },
      age: { type: Number },
      hobbies: { type: Array },
      team: { type: Schema.Types.ObjectId, ref: 'Team' },
    }, { collection: 'user'})
    const UserModel = model('User', UserSchema)
    const result = await UserModel.find({ age: { $gt: 30 }}).exec()
    console.log(result)
  } catch(e) {
    console.error(e)
  } finally {
    await disconnect()
  }
}

main()