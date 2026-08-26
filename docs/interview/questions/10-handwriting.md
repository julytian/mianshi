# 手写题

> **怎么用：** 先盖住答案，限时在编辑器 / 白板上写一版可跑代码，再点开 `参考答案` 对照边界与讲解。每题目标是「能写、能讲、能说复杂度」，不是背最长实现。中英文术语之间请习惯留空格。

本模块覆盖前端常考手写：**工具函数、异步控制、原型与组合、简易响应式**。口述时先说思路与边界，再写代码。

---

### Q1. 实现 `debounce`（防抖）

**考察点：** 定时器重置、`this` / 参数保留、立即执行与取消防抖

::: details 参考答案
**思路：** 每次调用都清掉上一次定时器，只有「停下来」满 `wait` ms 才真正执行。适合搜索框、resize 收尾。

```js
function debounce(fn, wait = 300, immediate = false) {
  let timer = null
  const debounced = function (...args) {
    const ctx = this
    const callNow = immediate && !timer
    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      if (!immediate) fn.apply(ctx, args)
    }, wait)
    if (callNow) fn.apply(ctx, args)
  }
  debounced.cancel = () => {
    clearTimeout(timer)
    timer = null
  }
  return debounced
}

// 自测
const log = debounce((x) => console.log('run', x), 200)
log(1)
log(2) // 约 200ms 后只打印 run 2
```

**讲解：** 闭包保存 `timer`；用 `apply` 保留调用时的 `this` 与参数。`immediate` 版是「先触发，冷却期内忽略」。组件卸载务必 `cancel`，避免卸了还改状态。 lodash 的 `maxWait` 是进阶点：防止一直输入永远不触发。
:::

**追问：**
1. 防抖和节流怎么一眼选型？
2. Vue 里写在 `setup` 里的防抖函数，卸载时要注意什么？
3. Promise 版防抖（只保留最后一次结果）你会怎么写？

**踩坑：** 把 `timer` 挂在组件实例上却忘记清理；或箭头函数包一层导致 `this` 永远是错的。

---

### Q2. 实现 `throttle`（节流）

**考察点：** 时间戳法 / 定时器法、尾触发、与防抖对比

::: details 参考答案
**思路：** 固定时间窗口内最多执行一次。适合 scroll、mousemove、按钮连点降频。

```js
function throttle(fn, wait = 300, { leading = true, trailing = true } = {}) {
  let last = 0
  let timer = null
  let lastArgs
  let lastThis

  const throttled = function (...args) {
    lastArgs = args
    lastThis = this
    const now = Date.now()
    if (!leading && last === 0) last = now
    const remaining = wait - (now - last)

    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      last = now
      fn.apply(lastThis, lastArgs)
      lastArgs = lastThis = undefined
    } else if (trailing && !timer) {
      timer = setTimeout(() => {
        last = leading ? Date.now() : 0
        timer = null
        fn.apply(lastThis, lastArgs)
        lastArgs = lastThis = undefined
      }, remaining)
    } else if (!trailing) {
      // 本窗口不会再使用参数，立即释放对象引用
      lastArgs = lastThis = undefined
    }
  }
  throttled.pending = () =>
    timer !== null || lastArgs !== undefined || lastThis !== undefined
  return throttled
}

// 自测：尾触发必须使用窗口内最后一次调用的参数
const calls = []
const onScroll = throttle((value) => calls.push(value), 20)
onScroll('first')
onScroll('second')
onScroll('last')
setTimeout(() => console.log(calls), 30) // ['first', 'last']

const noTrailing = throttle(() => {}, 20, { trailing: false })
noTrailing({ large: new Array(10_000) })
noTrailing({ shouldBeReleased: true })
if (noTrailing.pending()) throw new Error('unexpected retained arguments')
```

**讲解：** 时间戳法保证 leading 准时；定时器补 trailing。`lastArgs` / `lastThis` 每次调用都更新，保证尾触发拿到窗口内最后一次调用，而不是创建定时器那次。`trailing=false` 且本次不执行时没有未来消费者，必须立即清引用；`pending()` 测试证明闭包不再持有参数或调用对象。面试写清 leading/trailing 语义比抄完整 lodash 更加分。
:::

**追问：**
1. 只要 leading、不要 trailing 的场景？
2. `requestAnimationFrame` 节流和 `setTimeout` 节流差在哪？
3. 如何给节流函数加 `cancel`？

**踩坑：** 只用 `setInterval` 硬节流，页面后台时行为怪异；或 trailing 重复触发 leading。

---

### Q3. 实现 `deepClone`，并说明边界

**考察点：** 递归、循环引用、内置对象、与 `structuredClone` / JSON 对比

::: details 参考答案
**思路：** 用 `WeakMap` 记「源 → 副本」打断环；按类型分别处理。

```js
function deepClone(val, map = new WeakMap()) {
  if (
    val === null ||
    (typeof val !== 'object' && typeof val !== 'function')
  ) return val
  if (typeof val === 'function') return val // 函数通常浅共享
  if (map.has(val)) return map.get(val)

  if (val instanceof Date) return new Date(val)
  if (val instanceof RegExp) return new RegExp(val.source, val.flags)

  if (val instanceof Map) {
    const m = new Map()
    map.set(val, m)
    val.forEach((v, k) => m.set(deepClone(k, map), deepClone(v, map)))
    return m
  }

  if (val instanceof Set) {
    const s = new Set()
    map.set(val, s)
    val.forEach((v) => s.add(deepClone(v, map)))
    return s
  }

  // Reflect.ownKeys 包含字符串、Symbol 与不可枚举自身属性
  const obj = Array.isArray(val)
    ? []
    : Object.create(Object.getPrototypeOf(val))
  map.set(val, obj)
  Reflect.ownKeys(val).forEach((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(val, key)
    if ('value' in descriptor) {
      descriptor.value = deepClone(descriptor.value, map)
    }
    Object.defineProperty(obj, key, descriptor)
  })
  return obj
}

// 自测：循环引用、不可枚举属性和 getter 描述符
const a = { n: 1 }
a.self = a
Object.defineProperty(a, 'hidden', { value: { ok: true }, enumerable: false })
Object.defineProperty(a, 'double', { get() { return this.n * 2 } })
const b = deepClone(a)
console.log(
  b.self === b,
  Object.getOwnPropertyDescriptor(b, 'hidden').enumerable === false,
  Object.getOwnPropertyDescriptor(b, 'double').get !== undefined,
) // true true true
```

**边界讲解（口述必提）：**

| 手段 | 丢什么 / 坑 |
| ---- | ----------- |
| `JSON.parse(JSON.stringify)` | 函数、`undefined`、Symbol、循环引用炸、Date→字符串 |
| 手写递归 | 要自己处理环、Map/Set、原型、属性描述符 |
| `structuredClone` | 现代环境首选；函数 / DOM 节点仍不行 |

`Reflect.ownKeys` 不只返回可枚举属性；配合属性描述符可避免读取 getter，也能保留 writable / enumerable / configurable。这个实现仍不克隆函数闭包、DOM、Promise、WeakMap，也未完整复制所有内置对象的内部槽。业务里优先不可变更新或 `structuredClone`。
:::

**追问：**
1. 为什么用 `WeakMap` 而不是 `Map`？
2. 要不要拷贝不可枚举属性 / Symbol key？
3. Vue 的 `reactive` 对象深拷要注意什么？

**踩坑：** 忘记循环引用直接爆栈；或对 `null` 当 object 处理（`typeof null === 'object'`）。

---

### Q4. 手写 `Promise.all`

**考察点：** 空数组、保序、失败短路、非 thenable

::: details 参考答案
**思路：** 全部成功才 resolve 数组（顺序与入参一致）；任一 reject 则立刻 reject。

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const list = Array.from(iterable)
    const n = list.length
    if (n === 0) {
      resolve([])
      return
    }
    const result = new Array(n)
    let done = 0
    list.forEach((item, i) => {
      Promise.resolve(item).then(
        (val) => {
          result[i] = val
          done += 1
          if (done === n) resolve(result)
        },
        reject,
      )
    })
  })
}

// 自测
promiseAll([1, Promise.resolve(2), Promise.resolve(3)]).then(console.log)
// [1, 2, 3]
promiseAll([]).then((r) => console.log('empty', r)) // []
```

**讲解：** `Promise.resolve` 统一普通值与 thenable。计数器 `done` 而不是 `i === n-1`，因为完成顺序不定。对比：`allSettled` 不短路；`race` 只要第一个；`any` 要第一个成功。
:::

**追问：**
1. 已有一个失败后，其它 Promise 还在跑，怎么取消？
2. 手写 `allSettled` 和 `all` 差在哪几行？
3. 稀疏数组 / 类数组要注意什么？

**踩坑：** 用 `push` 收集结果导致乱序；空数组忘了立刻 resolve。

---

### Q5. 实现并发池（限制同时进行的异步任务数）

**考察点：** 队列、槽位回收、错误策略、与 `Promise.all` 组合

::: details 参考答案
**思路：** 最多 `limit` 个任务 in-flight；完成后从队列取下一个。适合批量上传、批量请求。

```js
async function asyncPool(limit, tasks) {
  const ret = []
  const executing = new Set()

  for (const task of tasks) {
    const p = Promise.resolve().then(() => task())
    ret.push(p)
    executing.add(p)
    const clean = () => executing.delete(p)
    p.then(clean, clean)

    if (executing.size >= limit) {
      await Promise.race(executing)
    }
  }
  return Promise.all(ret)
}

// 自测：最多 2 个并发
const sleep = (ms, id) => () =>
  new Promise((r) => setTimeout(() => {
    console.log('done', id)
    r(id)
  }, ms))

asyncPool(2, [sleep(300, 1), sleep(100, 2), sleep(100, 3), sleep(100, 4)])
  .then(console.log)
```

**讲解：** `Promise.race(executing)` 等「任意一个槽位空出来」。若要失败不中断整批，把内层改成 `allSettled` 或 task 内自行 catch。面试可画：队列长度、inflight、完成回调三块。
:::

**追问：**
1. 动态追加任务（生产者-消费者）怎么改？
2. 失败是快速失败还是继续跑完？
3. 和浏览器 HTTP/1.1 六连接限制的关系？

**踩坑：** 用递归 + 全局 index 却在错误路径漏推进；或 `limit` 写成同步 for 循环里直接 `await` 变成串行。

---

### Q6. 实现发布订阅（EventEmitter / pub-sub）

**考察点：** `on` / `off` / `emit` / `once`、同事件多监听、解绑安全

::: details 参考答案
```js
class EventEmitter {
  constructor() {
    this.map = Object.create(null) // type -> Set<fn>
  }

  on(type, fn) {
    if (!this.map[type]) this.map[type] = new Set()
    this.map[type].add(fn)
    return () => this.off(type, fn) // 返回取消函数更友好
  }

  off(type, fn) {
    this.map[type]?.delete(fn)
  }

  once(type, fn) {
    const wrap = (...args) => {
      this.off(type, wrap)
      fn.apply(this, args)
    }
    this.on(type, wrap)
  }

  emit(type, ...args) {
    // 拷贝再遍历，防止回调里 off 影响当前轮次
    ;[...(this.map[type] || [])].forEach((fn) => {
      try {
        fn.apply(this, args)
      } catch (e) {
        console.error(e)
      }
    })
  }
}

// 自测
const bus = new EventEmitter()
const off = bus.on('msg', (x) => console.log('a', x))
bus.once('msg', (x) => console.log('once', x))
bus.emit('msg', 1)
bus.emit('msg', 2)
off()
bus.emit('msg', 3) // 无输出（once 与 a 都已解绑）
```

**讲解：** 用 `Set` 便于 `off`；`emit` 时浅拷贝监听列表，避免边触发边取消导致漏调 / 错调。全局 bus 易造成隐式耦合与泄漏——组件级要成对 `off`，或改用框架官方事件 / 提供-注入。
:::

**追问：**
1. `emit` 同步还是异步调度更好？
2. 内存泄漏常见在哪？
3. 和 Vue 的 `mitt` / 生命周期怎么配合？

**踩坑：** `off` 传了匿名函数对不上；或 `emit` 时直接遍历原 Set 同时 `delete` 跳过元素。

---

### Q7. 手写 `instanceof`

**考察点：** 原型链行走、`Symbol.hasInstance`、边界值

::: details 参考答案
**思路：** 看 `Ctor.prototype` 是否出现在 `obj` 的原型链上。

```js
function myInstanceof(obj, Ctor) {
  // 沿构造器原型链找自定义钩子，但跳过内建默认实现
  let owner = Ctor
  while (owner != null) {
    if (Object.prototype.hasOwnProperty.call(owner, Symbol.hasInstance)) {
      if (owner !== Function.prototype) {
        const custom = owner[Symbol.hasInstance]
        if (typeof custom !== 'function') {
          throw new TypeError('@@hasInstance must be callable')
        }
        return !!custom.call(Ctor, obj)
      }
      break
    }
    owner = Object.getPrototypeOf(owner)
  }

  if (typeof Ctor !== 'function') {
    throw new TypeError('Right-hand side of instanceof is not callable')
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return false
  }

  let proto = Object.getPrototypeOf(obj)
  const target = Ctor.prototype
  if (target === null || (typeof target !== 'object' && typeof target !== 'function')) {
    throw new TypeError('Function has non-object prototype')
  }
  while (proto) {
    if (proto === target) return true
    proto = Object.getPrototypeOf(proto)
  }
  return false
}

// 自测
console.log(myInstanceof([], Array)) // true
console.log(myInstanceof([], Object)) // true
console.log(myInstanceof(1, Number)) // false
class Even {
  static [Symbol.hasInstance](value) {
    return Number.isInteger(value) && value % 2 === 0
  }
}
class PositiveEven extends Even {}
console.log(myInstanceof(2, Even)) // true：自有自定义钩子
console.log(myInstanceof(4, PositiveEven)) // true：继承的自定义钩子
```

**讲解：** 原生属性查找允许子类继承父类的自定义 `@@hasInstance`，所以这里沿构造器原型链查找并调用；但遇到 `Function.prototype` 的内建默认实现时主动跳过，避免绕回原生 `instanceof`，普通函数继续显式遍历对象原型链。跨 iframe 的 `Array` 不同，数组检测应使用 `Array.isArray`。
:::

**追问：**
1. `instanceof` 和 `typeof` 分别解决什么？
2. 手动改 `__proto__` 后结果会怎样？
3. 为什么检测数组更推荐 `Array.isArray`？

**踩坑：** 对 `null` / `undefined` 调 `getPrototypeOf` 抛错；或忽略右操作数非函数。

---

### Q8. 实现 `compose` / `pipe`

**考察点：** 函数组合、从右到左 vs 从左到右、异步组合可选

::: details 参考答案
```js
// compose: 从右到左 f(g(h(x)))
const compose =
  (...fns) =>
  (x) =>
    fns.reduceRight((acc, fn) => fn(acc), x)

// pipe: 从左到右 h 再 g 再 f，读起来像流水线
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((acc, fn) => fn(acc), x)

const add1 = (n) => n + 1
const double = (n) => n * 2
console.log(compose(double, add1)(3)) // (3+1)*2 = 8
console.log(pipe(add1, double)(3)) // 同上语义不同写法：8

// 异步 pipe（可选加分）
const pipeAsync =
  (...fns) =>
  (x) =>
    fns.reduce((acc, fn) => acc.then(fn), Promise.resolve(x))
```

**讲解：** Redux 中间件、koa 洋葱模型都是组合思想。同步版用 `reduce` / `reduceRight` 一行够用；空 `fns` 时返回恒等 `x => x`。业务里过度 compose 会降低可读性——组合 2～4 个纯函数最舒服。
:::

**追问：**
1. 多参数函数怎么先 `curry` 再 compose？
2. 和 middleware「next」模型有何不同？
3. TypeScript 里怎么给 compose 写类型（口述即可）？

**踩坑：** 搞反 compose / pipe 方向；或对有副作用的函数狂 compose 导致调试地狱。

---

### Q9. 简易 `reactive`（依赖收集 + 触发更新）

**考察点：** `Proxy`、`track` / `trigger`、activeEffect、与 Vue 3 对照

::: details 参考答案
**最小模型：** 读属性时收集当前 effect；写属性时触发相关 effect。

```js
let activeEffect = null
const bucket = new WeakMap() // target -> Map<key, Set<effect>>

function track(target, key) {
  if (!activeEffect) return
  let depsMap = bucket.get(target)
  if (!depsMap) bucket.set(target, (depsMap = new Map()))
  let deps = depsMap.get(key)
  if (!deps) depsMap.set(key, (deps = new Set()))
  deps.add(activeEffect)
}

function trigger(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  depsMap.get(key)?.forEach((fn) => fn())
}

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver)
      track(target, key)
      // 嵌套对象：访问时再代理（懒代理）
      if (res && typeof res === 'object') return reactive(res)
      return res
    },
    set(target, key, value, receiver) {
      const ok = Reflect.set(target, key, value, receiver)
      trigger(target, key)
      return ok
    },
  })
}

function effect(fn) {
  activeEffect = fn
  fn()
  activeEffect = null
}

// 自测
const state = reactive({ count: 0, nested: { n: 1 } })
effect(() => console.log('count =', state.count))
state.count++ // 再打印
```

**讲解：** 这是 Vue 3 响应式的玩具版。缺口：清理旧依赖（分支切换）、`scheduler`、`readonly`、数组索引 / `length`、`Map` 等集合、避免 `reactive` 无限套娃（要用 `reactiveMap` 缓存）。口述「能跑最小 demo + 知道和真 Vue 差在哪」即可。
:::

**追问：**
1. 为什么用 `WeakMap`？
2. `effect` 里又读又写同一字段会死循环吗？怎么破？
3. `ref` 和 `reactive` 在这套模型里怎么统一？

**踩坑：** 嵌套每次 `get` 都 `new Proxy` 导致依赖对不上；或忘记 `Reflect` 弄丢 `receiver` / getter。

---

### Q10. 数组扁平化 `flatten`

**考察点：** 递归 / 迭代、`depth`、与 `Array.prototype.flat` 对齐

::: details 参考答案
```js
function flatten(arr, depth = 1) {
  if (depth < 1) return arr.slice()
  const out = []
  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      out.push(...flatten(item, depth - 1))
    } else {
      out.push(item)
    }
  }
  return out
}

// 栈迭代版（防爆栈，常考）
function flattenIter(arr, depth = Infinity) {
  const stack = arr.map((v) => [v, depth])
  const out = []
  while (stack.length) {
    const [cur, d] = stack.pop()
    if (Array.isArray(cur) && d > 0) {
      for (const v of cur) stack.push([v, d - 1])
    } else {
      out.push(cur)
    }
  }
  return out.reverse()
}

console.log(flatten([1, [2, [3, [4]]], 5], 2)) // [1, 2, 3, [4], 5]
console.log([1, [2, [3]]].flat(Infinity))
```

**讲解：** 默认 `depth = 1` 对齐原生 `flat`。`reduce + concat` 也能写但大数组有中间数组成本。稀疏数组、空位行为面试提一句「与规范一致与否看面试官要求」即可。
:::

**追问：**
1. `flatMap` 和 `map + flat(1)` 关系？
2. 如何扁平「类数组」？
3. 无限深度用递归的风险？

**踩坑：** 用 `toString` / `join` 伪扁平丢失类型；或 `concat` 不判断 depth。

---

### Q11. 手写 `call` / `apply` / `bind`

**考察点：** 显式绑定 `this`、参数传递、bound 函数的原型与 `new`

::: details 参考答案
```js
Function.prototype.myCall = function (thisArg, ...args) {
  if (typeof this !== 'function') throw new TypeError('not a function')
  const ctx =
    thisArg === null || thisArg === undefined
      ? (typeof globalThis !== 'undefined' ? globalThis : window)
      : Object(thisArg)
  const key = Symbol('fn')
  ctx[key] = this
  try {
    return ctx[key](...args)
  } finally {
    delete ctx[key]
  }
}

Function.prototype.myApply = function (thisArg, args) {
  return this.myCall(thisArg, ...(args || []))
}

Function.prototype.myBind = function (thisArg, ...preset) {
  const fn = this
  const bound = function (...args) {
    const allArgs = preset.concat(args)
    if (new.target) {
      return Reflect.construct(fn, allArgs, new.target)
    }
    return Reflect.apply(fn, thisArg, allArgs)
  }
  if (fn.prototype) bound.prototype = Object.create(fn.prototype)
  return bound
}

// 自测
function greet(a, b) {
  return `${this.name}-${a}-${b}`
}
console.log(greet.myCall({ name: 'A' }, 1, 2))
console.log(greet.myApply({ name: 'B' }, [3, 4]))
const g = greet.myBind({ name: 'C' }, 5)
console.log(g(6))
function User(name) {
  this.name = name
}
const BoundUser = User.myBind(null, 'Ada')
const user = new BoundUser()
console.log(user.name, user instanceof User) // Ada true
```

**讲解：** `myCall` 用 `try/finally` 保证目标函数抛错时也删除临时 Symbol；但向 frozen / non-extensible 对象挂临时属性仍会失败，且严格模式 `this`、函数 `name/length` 等细节未完全模拟，因此这是教学近似。生产中可靠调用直接用 `Reflect.apply(fn, thisArg, args)`。`myBind` 的构造分支用 `Reflect.construct(fn, args, new.target)`，正确传递 `new.target` 并忽略绑定的 `thisArg`。
:::

**追问：**
1. `bind` 之后还能再 `bind` 改 `this` 吗？
2. 为什么要用 `Symbol` 当临时 key？
3. 箭头函数的 `call/apply/bind` 为何改不了 `this`？

**踩坑：** `bind` 忘记 `new` 场景；或 `apply` 第二参 `null` 未当 `[]` 处理。

---

## 深度题

> D 题先口述思路、复杂度、边界与测试，再写关键实现；不追求在白板复刻生产级长代码。

### D1. 手写定高虚拟列表的核心计算与渲染窗口

**考察点：** 可视区间、缓冲区、占位高度、滚动定位

::: details 参考答案
#### 基础结论
容器只渲染可视区附近的元素，外层用总高度撑开滚动条，内层列表用 `transform` 移到起始项位置。面试写窗口计算即可，不必实现完整组件。

#### 原理深挖
定高 `itemHeight` 时：

```ts
import assert from 'node:assert/strict'

function getRange(
  scrollTop: number,
  viewportHeight: number,
  itemHeight: number,
  count: number,
  overscan = 3,
) {
  if (!Number.isFinite(itemHeight) || itemHeight <= 0) {
    throw new RangeError('itemHeight must be greater than 0')
  }
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('count must be a non-negative integer')
  }
  if (!Number.isFinite(viewportHeight) || viewportHeight < 0) {
    throw new RangeError('viewportHeight must be non-negative')
  }
  if (!Number.isFinite(scrollTop)) {
    throw new RangeError('scrollTop must be finite')
  }
  if (!Number.isInteger(overscan) || overscan < 0) {
    throw new RangeError('overscan must be a non-negative integer')
  }

  const safeScrollTop = Math.max(0, scrollTop)
  const visibleStart = Math.floor(safeScrollTop / itemHeight)
  const start = Math.min(
    count,
    Math.max(0, visibleStart - overscan),
  )
  const end = Math.max(
    start,
    Math.min(
      count,
      Math.ceil((safeScrollTop + viewportHeight) / itemHeight) + overscan,
    ),
  )
  return { start, end, offset: start * itemHeight, total: count * itemHeight }
}

assert.equal(getRange(-20, 100, 20, 10).start, 0)
assert.deepEqual(
  getRange(999, 100, 20, 10),
  { start: 10, end: 10, offset: 200, total: 200 },
)
// 数据从很多条骤减为 3 条，旧 scrollTop 仍必须得到合法空窗口
assert.deepEqual(
  getRange(800, 100, 20, 3),
  { start: 3, end: 3, offset: 60, total: 60 },
)
assert.deepEqual(
  getRange(0, 100, 20, 0),
  { start: 0, end: 0, offset: 0, total: 0 },
)
assert.throws(() => getRange(0, 100, 0, 10), RangeError)
assert.throws(() => getRange(0, -1, 20, 10), RangeError)
assert.throws(() => getRange(0, 100, 20, -1), RangeError)
```

计算是 O(1)，实际渲染 O(k)，`k` 为窗口元素数；空间 O(k)。overscan 用少量额外 DOM 换快速滚动稳定性。

#### 工程场景
模板渲染 `items.slice(start, end)`，key 使用稳定业务 id；滚动事件用 `requestAnimationFrame` 合并；数据追加后保持锚点。动态高度需要高度缓存、前缀和与二分查找，面试只说明扩展方向。

#### 反例 / 踩坑
用 index 作 key 导致滚动复用错位；总高度漏算造成滚动条跳变；每次 scroll 同步测量全部节点引发布局抖动；筛选后未夹紧 start。

#### 资深回答模板
「定高版把 scrollTop 映射为 `[start, end)`，总高负责滚动尺度，offset 负责视觉位置。核心计算 O(1)，渲染 O(k)；动态高度再引入测量缓存和二分定位。」

#### 追问链
1. scrollTop 在两项边界上时为什么用 floor？
2. 如何测试空列表、最后一屏和极速滚动？
3. 动态高度变化后如何维持视觉锚点？
:::

**追问：**
1. 如何实现 `scrollToIndex`？
2. 为什么 overscan 不能无限大？
3. 可访问性上还要保留哪些列表语义？

**踩坑：** 只写 `slice`，没有总高度与 offset，结果仍无法形成正确滚动空间。

---

### D2. 手写树结构权限过滤，并保留命中节点的祖先链

**考察点：** 后序遍历、不可变转换、父子权限语义、复杂度

::: details 参考答案
#### 基础结论
先约定语义：`type: 'directory'` 是结构节点，无 `permission` 表示目录本身不额外设门槛，但必须有可见子节点才保留；`type: 'leaf'` 无 `permission` 表示公共叶子，直接可见。目录有权限时，目录权限和至少一个可见子节点必须同时满足。

#### 原理深挖
```ts
type TreeNode = {
  id: string
  type: 'directory' | 'leaf'
  permission?: string
  children?: TreeNode[]
}

function filterTree(
  nodes: TreeNode[],
  allowed: ReadonlySet<string>,
): TreeNode[] {
  return nodes.flatMap((node) => {
    const children = filterTree(node.children ?? [], allowed)
    const permissionAllowed =
      !node.permission || allowed.has(node.permission)
    const visible = node.type === 'directory'
      ? permissionAllowed && children.length > 0
      : permissionAllowed
    return visible
      ? [{ ...node, children }]
      : []
  })
}
```

每个节点访问一次，时间 O(n)；输出与递归栈空间 O(n)，树极深时可改显式栈。`flatMap` 表达 0 或 1 个输出节点。

#### 工程场景
节点类型必须显式，不能用「有没有 children」猜空目录是目录还是叶子。公共叶节点、受限叶节点、无权限目录、受限目录分别写测试；禁用与隐藏不是一回事。服务端仍是授权权威，前端过滤只改善菜单体验。

#### 反例 / 踩坑
只过滤叶子导致空父菜单残留；原地 splice 跳项；把「有父权限」错误地推导为所有子权限；存在环或重复引用时递归失控。

#### 资深回答模板
「我用后序遍历先得到可见子树，再决定是否保留父节点。复杂度 O(n)，返回新树；权限继承、目录保留与服务端权威要在写代码前约定。」

#### 追问链
1. 如何同时返回半选与全选状态？
2. 十万节点且频繁切角色如何缓存？
3. 输入不是树而是 `id/pid` 扁平表时先做什么？
:::

**追问：**
1. 如何保留原始节点顺序？
2. 权限集合更新后怎样增量计算？
3. 如何测试孤儿节点、空权限和深链？

**踩坑：** 把菜单显隐当服务端授权，抓包后仍能调用未授权接口。

---

### D3. 手写 LRU，并扩展为请求去重与结果缓存

**考察点：** `Map` 插入顺序、`get` 提升为最新、容量淘汰

::: details 参考答案
#### 基础结论
**思路：** `Map` 保插入序；访问时删了再设，挪到最后；超出容量删最老（`Map.keys().next()`）。

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.map = new Map()
  }

  get(key) {
    if (!this.map.has(key)) return -1
    const val = this.map.get(key)
    this.map.delete(key)
    this.map.set(key, val)
    return val
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.capacity) {
      const oldest = this.map.keys().next().value
      this.map.delete(oldest)
    }
  }
}

// 自测
const cache = new LRUCache(2)
cache.put(1, 1)
cache.put(2, 2)
console.log(cache.get(1)) // 1
cache.put(3, 3) // 淘汰 2
console.log(cache.get(2)) // -1
```

#### 原理深挖
LRU 的 `get` / `put` 平均 O(1)，空间 O(capacity)。已完成结果与飞行中 Promise 是两层：LRU 管结果容量，`inflight` Map 让同 key 并发调用共享一次请求；失败后必须删除 inflight，通常不缓存失败。

#### 工程场景
```ts
function createRequestCache<T>(capacity = 100) {
  const cache = new LRUCache(capacity)
  const inflight = new Map<string, Promise<T>>()

  return (key: string, loader: () => Promise<T>) => {
    const hit = cache.get(key)
    if (hit !== -1) return Promise.resolve(hit as T)
    if (inflight.has(key)) return inflight.get(key)!

    const task = loader()
      .then((value) => {
        cache.put(key, value)
        return value
      })
      .finally(() => inflight.delete(key))
    inflight.set(key, task)
    return task
  }
}
```

真实实现不要用 `-1` 作为通用 miss 哨兵，可提供 `has` 或唯一 Symbol；再按业务增加 TTL、主动失效和调用方取消策略。

#### 反例 / 踩坑
把 Promise 永久放进 LRU，失败后所有请求一直复用 rejected Promise；任一调用方 abort 就取消共享请求；缓存 key 漏掉用户、租户或查询条件导致串数据。

#### 资深回答模板
「LRU 解决已完成结果的容量淘汰，inflight Map 解决同 key 并发去重。二者生命周期不同：失败清飞行态，写操作主动失效结果缓存，key 必须覆盖权限与参数。」

#### 追问链
1. 多个调用方如何实现引用计数取消？
2. TTL 与 LRU 同时存在时先判断什么？
3. stale-while-revalidate 如何避免并发刷新？
:::

**追问：**
1. 为什么不用普通对象 + 数组模拟？
2. 带 TTL 的 LRU 怎么扩展？
3. `WeakMap` 能做 LRU 吗？为什么不能按 key 枚举淘汰？

**踩坑：** `get` 不更新顺序，LRU 退化成普通 Map；容量 ≤ 0 未校验。

---

### D4. 手写 TypeScript 类型工具：`DeepReadonly`、`Awaited` 与互斥对象

**考察点：** 条件类型、`infer`、递归映射、联合类型分发

::: details 参考答案
#### 基础结论
先说输入输出和边界，再写最小类型。类型题追求可读与可解释，不为覆盖所有内置对象写一屏体操。

#### 原理深挖
```ts
type DeepReadonly<T> =
  T extends (...args: any[]) => any
    ? T
    : T extends readonly (infer U)[]
      ? ReadonlyArray<DeepReadonly<U>>
      : T extends object
        ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
        : T

type MyAwaited<T> =
  T extends null | undefined
    ? T
    : T extends PromiseLike<infer U>
      ? MyAwaited<U>
      : T

type Without<T, U> = { [K in Exclude<keyof T, keyof U>]?: never }
type XOR<T, U> = (T & Without<U, T>) | (U & Without<T, U>)
```

映射类型遍历 key；条件类型遇裸类型参数会对联合分发；`infer` 从结构中提取类型。递归深度与编译性能都是边界。

#### 工程场景
`DeepReadonly` 用于配置快照，`MyAwaited` 提取异步结果，`XOR` 表达组件 props「二选一」。使用 `tsc --noEmit` 加 `@ts-expect-error` 写正反编译用例。

#### 反例 / 踩坑
把函数也映射成只读对象而丢失调用签名；只识别原生 `Promise` 不识别 thenable；XOR 只写 `T | U`，导致同时传两组字段仍可能通过。

#### 资深回答模板
「我先用条件类型分出函数、数组、对象和原始值，再递归映射；用 infer 解包 PromiseLike。类型工具必须有应通过和应报错两组编译测试，并控制递归复杂度。」

#### 追问链
1. 如何阻止条件类型对联合分发？
2. tuple 在当前 `DeepReadonly` 中会丢失什么信息？
3. `any`、`unknown`、`never` 分别会怎样传播？
:::

**追问：**
1. 如何实现 `Mutable<T>`？
2. 为什么类型测试不能只看 IDE hover？
3. 何时应直接使用 TypeScript 内置 `Awaited`？

**踩坑：** 类型写得很炫但错误输入也能通过，且没人能解释分发条件。

---

### D5. 设计支持取消、重试退避和结果保序的并发请求池

**考察点：** 调度器、AbortSignal、指数退避、抖动、失败策略

::: details 参考答案
#### 基础结论
本实现明确采用 **fail-fast**：任务在耗尽重试或被 `shouldRetry` 判为不可重试后，记录共享 `fatal`，停止领取新任务，并用内部 `AbortController` 通知在途任务；调用方传入的 `signal` 会联动内部取消。成功结果按输入顺序返回。

取消是协作式的：任务必须把收到的 `signal` 传给 fetch、计时器等底层操作。忽略 signal 的任务无法被 JavaScript 强制终止；池只能立即拒绝、丢弃其晚到结果，并让该任务在后台自行结束。若业务需要收集全部结果，应另做 all-settled 版本，不要混用两套失败语义。

#### 原理深挖
核心状态是 `nextIndex`、独立布尔值 `hasFatal`、错误值 `fatal`、结果数组和内部取消信号。不能用 `fatal === null` 判断状态，因为任务合法地可能抛出 `null`、`undefined` 或 `0`。每个 worker 同步领取唯一索引，再异步执行，天然限制并发；写回原索引保证顺序。

```js
function abortReason(signal) {
  return signal.reason ?? new DOMException('Aborted', 'AbortError')
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortReason(signal))
      return
    }

    const onAbort = () => {
      clearTimeout(timer)
      reject(abortReason(signal))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

async function withRetry(task, options) {
  const {
    signal,
    retries,
    baseDelay,
    maxDelay,
    shouldRetry,
    jitter,
  } = options

  for (let attempt = 0; ; attempt++) {
    if (signal.aborted) throw abortReason(signal)
    try {
      return await task(signal, attempt)
    } catch (error) {
      if (signal.aborted) throw abortReason(signal)
      if (attempt >= retries || !shouldRetry(error, attempt)) throw error
      const ceiling = Math.min(maxDelay, baseDelay * 2 ** attempt)
      const delay = jitter(ceiling, attempt)
      if (!Number.isFinite(delay) || delay < 0 || delay > ceiling) {
        throw new RangeError('jitter must return a number within [0, ceiling]')
      }
      await sleep(delay, signal)
    }
  }
}

async function requestPool(tasks, options = {}) {
  const {
    limit = 3,
    retries = 0,
    baseDelay = 200,
    maxDelay = 5_000,
    signal = new AbortController().signal,
    shouldRetry = (error) => error?.retryable === true,
    jitter = (ceiling) => Math.random() * ceiling,
  } = options

  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError('limit must be a positive integer')
  }
  if (!Number.isInteger(retries) || retries < 0) {
    throw new RangeError('retries must be a non-negative integer')
  }
  if (!Number.isFinite(baseDelay) || baseDelay < 0) {
    throw new RangeError('baseDelay must be a non-negative finite number')
  }
  if (
    !Number.isFinite(maxDelay) ||
    maxDelay < 0 ||
    maxDelay < baseDelay
  ) {
    throw new RangeError('maxDelay must be finite and >= baseDelay')
  }
  if (typeof shouldRetry !== 'function') {
    throw new TypeError('shouldRetry must be a function')
  }
  if (typeof jitter !== 'function') {
    throw new TypeError('jitter must be a function')
  }
  if (signal.aborted) throw abortReason(signal)
  if (tasks.length === 0) return []

  const results = new Array(tasks.length)
  const internal = new AbortController()
  let nextIndex = 0
  let hasFatal = false
  let fatal

  const fail = (error) => {
    if (!hasFatal) {
      hasFatal = true
      fatal = error
      internal.abort(error)
    }
    return fatal
  }

  let rejectExternalAbort
  const externalAbort = new Promise((_, reject) => {
    rejectExternalAbort = reject
  })
  const onExternalAbort = () => {
    const error = abortReason(signal)
    fail(error)
    rejectExternalAbort(error)
  }
  signal.addEventListener('abort', onExternalAbort, { once: true })

  async function worker() {
    while (!hasFatal) {
      const index = nextIndex
      nextIndex += 1
      if (index >= tasks.length) return

      try {
        const value = await withRetry(tasks[index], {
          signal: internal.signal,
          retries,
          baseDelay,
          maxDelay,
          shouldRetry,
          jitter,
        })
        if (hasFatal) return // 忽略不响应取消的任务的晚到结果
        results[index] = value
      } catch (error) {
        throw fail(error)
      }
    }
  }

  const workerCount = Math.min(limit, tasks.length)
  const workers = Promise.all(
    Array.from({ length: workerCount }, () => worker()),
  )
  try {
    await Promise.race([workers, externalAbort])
    return results
  } finally {
    signal.removeEventListener('abort', onExternalAbort)
  }
}
```

#### 工程场景
HTTP 只自动重试网络瞬断、429 或部分 5xx，并尊重 `Retry-After`；非幂等 POST 需要幂等键。`hasFatal` 和 `fatal` 必须在 `internal.abort()` 前写入，避免其他 worker 把 AbortError 误当第一根因。调用方取消走同一 fatal 路径，确保取消后不再领取。

设任务数为 n、实际总尝试次数为 A：调度与结果写入时间为 O(A)，不含任务自身耗时和退避等待；结果数组占 O(n)，worker 与在途任务占 O(min(n, limit))，总空间 O(n + min(n, limit))。

以下测试保存为 `.mjs`，与上方实现放在同一文件可直接用 Node.js 运行：

```js
import assert from 'node:assert/strict'

const delayTask = (value, ms, onState = () => {}) =>
  async (signal) => {
    onState(1)
    try {
      await sleep(ms, signal)
      return value
    } finally {
      onState(-1)
    }
  }

const rawWait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 1. 空任务
assert.deepEqual(await requestPool([], { limit: 2 }), [])

// 2. 并发为 1：任意时刻只有一个任务运行
let active = 0
let maxActive = 0
const track = (delta) => {
  active += delta
  maxActive = Math.max(maxActive, active)
}
await requestPool([
  delayTask('a', 10, track),
  delayTask('b', 5, track),
], { limit: 1 })
assert.equal(maxActive, 1)

// 3. 失败后按策略重试
let attempts = 0
const retryResult = await requestPool([
  async () => {
    attempts += 1
    if (attempts < 3) {
      const error = new Error('temporary')
      error.retryable = true
      throw error
    }
    return 'ok'
  },
], { limit: 1, retries: 2, baseDelay: 0, jitter: () => 0 })
assert.deepEqual(retryResult, ['ok'])
assert.equal(attempts, 3)

// 4. 取消：在途 sleep 收到同一个 signal 并拒绝
const controller = new AbortController()
const cancelled = requestPool([
  delayTask('never', 100),
], { limit: 1, signal: controller.signal })
setTimeout(() => controller.abort(new Error('stop')), 5)
await assert.rejects(cancelled, /stop/)

// 5. 乱序完成但结果仍按输入顺序
assert.deepEqual(
  await requestPool([
    delayTask('slow', 20),
    delayTask('fast', 1),
  ], { limit: 2 }),
  ['slow', 'fast'],
)

// 6. 非法 limit
await assert.rejects(
  () => requestPool([], { limit: 0 }),
  RangeError,
)

// 7. 永久失败后不再领取新任务
const startedAfterFatal = []
await assert.rejects(
  requestPool([
    async (signal) => {
      startedAfterFatal.push(0)
      await sleep(5, signal)
      throw new Error('fatal')
    },
    async (signal) => {
      startedAfterFatal.push(1)
      await sleep(50, signal)
    },
    async () => startedAfterFatal.push(2),
  ], { limit: 2 }),
  /fatal/,
)
assert.deepEqual(startedAfterFatal, [0, 1])

// 8. 抛出 null / undefined / 0 也会设置 fatal，不再领取新任务
for (const falsyReason of [null, undefined, 0]) {
  const started = []
  let fulfilled = true
  let rejection
  try {
    await requestPool([
      async () => {
        started.push(0)
        await rawWait(1)
        throw falsyReason
      },
      async () => {
        started.push(1)
        await rawWait(5) // 故意忽略 signal
      },
      async () => started.push(2),
    ], { limit: 2 })
  } catch (error) {
    fulfilled = false
    rejection = error
  }
  await rawWait(10)
  assert.equal(fulfilled, false)
  assert.equal(rejection, falsyReason)
  assert.deepEqual(started, [0, 1])
}

// 9. shouldRetry=false：即使 retries > 0 也只执行一次
let noRetryAttempts = 0
await assert.rejects(
  requestPool([
    async () => {
      noRetryAttempts += 1
      throw new Error('permanent')
    },
  ], { limit: 1, retries: 3, shouldRetry: () => false }),
  /permanent/,
)
assert.equal(noRetryAttempts, 1)

// 10. 指数退避不超过 maxDelay
const ceilings = []
await assert.rejects(
  requestPool([
    async () => {
      const error = new Error('retryable')
      error.retryable = true
      throw error
    },
  ], {
    limit: 1,
    retries: 3,
    baseDelay: 10,
    maxDelay: 25,
    jitter: (ceiling) => {
      ceilings.push(ceiling)
      return 0
    },
  }),
  /retryable/,
)
assert.deepEqual(ceilings, [10, 20, 25])

// 11. 外部取消后不领取下一项
const cancelController = new AbortController()
const startedAfterCancel = []
const cancelBeforeNext = requestPool([
  async (signal) => {
    startedAfterCancel.push(0)
    await sleep(100, signal)
  },
  async () => startedAfterCancel.push(1),
], { limit: 1, signal: cancelController.signal })
setTimeout(() => cancelController.abort(new Error('user cancel')), 5)
await assert.rejects(cancelBeforeNext, /user cancel/)
assert.deepEqual(startedAfterCancel, [0])

// 12. 忽略 signal 的任务不能强停，但晚到结果会被丢弃
let ignoredFinished = false
let thirdStarted = false
const ignoreSignal = requestPool([
  async () => { throw new Error('fatal now') },
  async () => {
    await rawWait(30) // 故意忽略收到的 signal
    ignoredFinished = true
    return 'late'
  },
  async () => { thirdStarted = true },
], { limit: 2 })
await assert.rejects(ignoreSignal, /fatal now/)
assert.equal(thirdStarted, false)
assert.equal(ignoredFinished, false)
await rawWait(35)
assert.equal(ignoredFinished, true)

// 13. 非法退避参数
await assert.rejects(
  () => requestPool([], { baseDelay: -1 }),
  RangeError,
)
await assert.rejects(
  () => requestPool([], { baseDelay: 20, maxDelay: 10 }),
  RangeError,
)
await assert.rejects(
  () => requestPool([], { maxDelay: Infinity }),
  RangeError,
)
await assert.rejects(
  () => requestPool([], { jitter: null }),
  TypeError,
)
await assert.rejects(
  () => requestPool([
    async () => {
      const error = new Error('retry')
      error.retryable = true
      throw error
    },
  ], { retries: 1, jitter: () => -1 }),
  RangeError,
)

console.log('requestPool tests passed (13 groups)')
```

#### 反例 / 踩坑
所有错误都重试；固定间隔无抖动；只 reject 外层却不设置 fatal，导致其他 worker 继续领取；把 abort 当原始错误覆盖真正 fatal；误称可以强杀忽略 signal 的 Promise；用 push 导致结果乱序。

#### 资深回答模板
「我先声明 fail-fast：首个永久失败写入共享 fatal，停止领取并 abort 在途任务；外部 signal 联动内部 controller。结果按索引回填，忽略 signal 的任务不能强杀，只能丢弃晚到结果。all-settled 要另写契约。」

#### 追问链
1. `AbortSignal.any()` 可怎样组合用户取消与超时？
2. 429 的 `Retry-After` 为什么优先于本地退避？
3. 如何测试最大并发从未超过 limit？
:::

**追问：**
1. 动态追加任务时 worker 如何等待？
2. 如何暴露进度而不破坏调度器封装？
3. 部分成功结果的数据结构怎么设计？

**踩坑：** 把重试写在池外导致每次重试重新占队列顺序，或取消后定时器仍悬挂。

---

## 限时练习建议

| 题号 | 建议限时 | 优先讲清的点 |
| ---- | -------- | ------------ |
| Q1–Q2 | 8 分钟 | 选型差异 + cancel |
| Q3 | 15 分钟 | 循环引用与类型表 |
| Q4–Q5 | 15 分钟 | 保序 / 槽位 |
| Q6–Q8 | 15 分钟 | API 完整性 |
| Q9 | 20 分钟 | track/trigger 口述 |
| Q10–Q11 | 15 分钟 | 递归边界 / `this` |
| D1–D2 | 20 分钟 | 窗口 / 树遍历 |
| D3–D5 | 20 分钟 | 缓存 / 类型 / 调度 |

写完每题用 30 秒口述：**时间复杂度、一个边界、一个和业务的联系**。
