import { AbilityBuilder, Ability } from '@casl/ability'
import { permittedFieldsOf } from '@casl/ability/extra'
import { pick } from 'lodash'
class Work {
  constructor(attrs) {
    // 这里就简单的将属性添加到类返回的实例上
    Object.assign(this, attrs);
  }
}
interface IUser {
  id: number;
  role: 'admin' | 'vip' | 'normal';
}

const adminuser: IUser = {
  id: 1,
  role: 'admin'
}
const normalUser: IUser = {
  id: 2,
  role: 'normal'
}
const payedUser: IUser = {
  id: 3,
  role: 'vip'
}
const WORK_FIELDS = ['id', 'author', 'isTemplate', 'title', 'content', 'uuid']
const options = { fieldsFrom: rule => rule.fields || WORK_FIELDS }
const normalWork = new Work({ id: 1, author: 2, isTemplate: true, title: 'test', content: 'test', uuid: 'abc' })
const vipWork = new Work({ id: 2, author: 3, isTemplate: false, title: 'test', content: 'test', uuid: 'xyz' })


function defineRules(user: IUser) {
  const { can, cannot, build } = new AbilityBuilder(Ability)
  if (user.role === 'admin') {
    can('manage', 'all')
  } else if (user.role === 'vip') {
    can('read', 'Work')
    can('download', 'Work')
    can('delete', 'Work', { author: user.id })
    can('update', 'Work', ['title', 'content', 'uuid'], { author: user.id })
  } else if (user.role === 'normal') {
    can('read', 'Work')
    can('delete', 'Work', { author: user.id })
    can('update', 'Work',  ['title', 'content'], { author: user.id })
  }
  return build()
}
// admin rules
const rules = defineRules(adminuser)
console.log(rules.can('read', 'Work'))
console.log(rules.can('delete', 'Work'))
console.log(rules.can('update', normalWork))
console.log(rules.can('update', vipWork))

// vip role
const rules2 = defineRules(payedUser)
console.log('vip', rules2.can('download', 'Work'))
console.log('vip update', rules2.can('update', vipWork, 'title'))
console.log('vip update', rules2.can('update', vipWork, 'uuid'))

// normal role
const rules3 = defineRules(normalUser)
console.log('normal', rules3.can('download', 'Work'))
console.log('normal', rules3.can('update', normalWork))
console.log('normal', rules3.can('update', vipWork))
console.log('normal update', rules3.can('update', normalWork, 'title'))
console.log('normal update', rules3.can('update', normalWork, 'uuid'))

// check allowed fields
const fields = permittedFieldsOf(rules2, 'update', vipWork, options)
console.log('vip allowed update', fields)
const fields2 = permittedFieldsOf(rules3, 'update', normalWork, options)
console.log('normal allowed update', fields2)

// normal User request
const reqBody = {
  title: 'CASL',
  content: 'powerful',
  uuid: 'viking', // 只有 vip 才能修改这个字段
}
const rawWork = pick(reqBody, fields2)
console.log('normal user after filter', rawWork)

