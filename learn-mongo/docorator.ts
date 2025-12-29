// 1 类装饰器
// 2 ** 方法装饰器 **
// 3 访问器或属性装饰器
// 4 参数装饰器

function doc1(prototype, key: string, descriptor: PropertyDescriptor) {
  console.log('pro', prototype === Car.prototype)
  console.log('key', key)
  console.log('descriptor', descriptor)  
  let originalMethod = descriptor.value
  descriptor.value = function () {
    originalMethod.call(this)
    console.log('rewrite method')
  }
}
function doc2(prototype, key: string, descriptor: PropertyDescriptor) {
  console.log('this is doc two')
}
function docFactory(brand: string) {
  return function(prototype, key: string, descriptor: PropertyDescriptor) {
    console.log(`${brand}this is doc two`)
  }
}
class Car {
  brand: string;
  constructor(brand: string) {
    this.brand = brand
  }
  @docFactory('benz')
  run() {
    console.log(this.brand + 'running')
  }
}

const car = new Car('BMW')
car.run()