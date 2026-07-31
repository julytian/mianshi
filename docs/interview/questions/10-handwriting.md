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
  return function (...args) {
    const ctx = this
    const now = Date.now()
    if (!leading && last === 0) last = now
    const remaining = wait - (now - last)

    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      last = now
      fn.apply(ctx, args)
    } else if (trailing && !timer) {
      timer = setTimeout(() => {
        last = leading ? Date.now() : 0
        timer = null
        fn.apply(ctx, args)
      }, remaining)
    }
  }
}

// 自测：连续调用，约每 300ms 执行一次，最后一次可尾触发
const onScroll = throttle(() => console.log('scroll'), 300)
```

**讲解：** 时间戳法保证 leading 准时；定时器补 trailing，避免「停住后最后一次丢了」。面试写清 leading/trailing 语义比抄完整 lodash 更加分。别和防抖混：防抖是「合并成最后一次」，节流是「均匀抽样」。
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
  if (val === null || typeof val !== 'object') return val
  if (typeof val === 'function') return val // 函数通常浅共享
  if (map.has(val)) return map.get(val)

  if (val instanceof Date) return new Date(val)
  if (val instanceof RegExp) return new RegExp(val.source, val.flags)

  if (Array.isArray(val)) {
    const arr = []
    map.set(val, arr)
    val.forEach((item, i) => {
      arr[i] = deepClone(item, map)
    })
    return arr
  }

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

  // 普通对象（含可枚举自身属性）
  const obj = Object.create(Object.getPrototypeOf(val))
  map.set(val, obj)
  Reflect.ownKeys(val).forEach((key) => {
    obj[key] = deepClone(val[key], map)
  })
  return obj
}

// 自测循环引用
const a = { n: 1 }
a.self = a
const b = deepClone(a)
console.log(b.n, b.self === b) // 1 true
```

**边界讲解（口述必提）：**

| 手段 | 丢什么 / 坑 |
| ---- | ----------- |
| `JSON.parse(JSON.stringify)` | 函数、`undefined`、Symbol、循环引用炸、Date→字符串 |
| 手写递归 | 要自己处理环、Map/Set、原型 |
| `structuredClone` | 现代环境首选；函数 / DOM 节点仍不行 |

别妄想「克隆一切」——DOM、闭包、Promise、WeakMap 键语义都不该深拷。业务里优先不可变更新或 `structuredClone`。
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
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return false // 原始值：除了被包装的特殊情况，规范上 instanceof 为 false
  }
  if (typeof Ctor !== 'function') {
    throw new TypeError('Right-hand side of instanceof is not callable')
  }
  if (typeof Ctor[Symbol.hasInstance] === 'function') {
    return !!Ctor[Symbol.hasInstance](obj)
  }

  let proto = Object.getPrototypeOf(obj)
  const target = Ctor.prototype
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
```

**讲解：** 真正引擎还会走 `Symbol.hasInstance`（如 `Array[Symbol.hasInstance]`）。跨 iframe 的 `Array` 不同，`instanceof Array` 会失败——这时用 `Array.isArray`。面试别只写 `obj.__proto__`，用 `Object.getPrototypeOf`。
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

console.log(flatten([1, [2, [3, [4]]], 5], 2)) // [1, 2, [3, [4]], 5]
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
  const result = ctx[key](...args)
  delete ctx[key]
  return result
}

Function.prototype.myApply = function (thisArg, args) {
  return this.myCall(thisArg, ...(args || []))
}

Function.prototype.myBind = function (thisArg, ...preset) {
  const fn = this
  const bound = function (...args) {
    // new bound() 时 this 指向新实例，忽略绑定的 thisArg
    const isNew = new.target !== undefined
    return fn.myApply(isNew ? this : thisArg, preset.concat(args))
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
```

**讲解：** 核心是「把函数变成对象方法再调用」。`bind` 要处理：预设参数柯里化、`new` 场景优先实例。严格模式与原始值 `this` 的包装细节可口述。现代代码更常用箭头函数 / 显式传参，但手写仍考透彻度。
:::

**追问：**
1. `bind` 之后还能再 `bind` 改 `this` 吗？
2. 为什么要用 `Symbol` 当临时 key？
3. 箭头函数的 `call/apply/bind` 为何改不了 `this`？

**踩坑：** `bind` 忘记 `new` 场景；或 `apply` 第二参 `null` 未当 `[]` 处理。

---

### Q12. （可选加分）LRU Cache

**考察点：** `Map` 插入顺序、`get` 提升为最新、容量淘汰

::: details 参考答案
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

**讲解：** O(1) 平均依赖 `Map`。白板也可讲「哈希 + 双向链表」。前端场景：请求结果缓存、图片 / 组件缓存淘汰。注意：并发异步下「飞行中的请求」要另做 dedupe，不单靠 LRU。
:::

**追问：**
1. 为什么不用普通对象 + 数组模拟？
2. 带 TTL 的 LRU 怎么扩展？
3. `WeakMap` 能做 LRU 吗？为什么不能按 key 枚举淘汰？

**踩坑：** `get` 不更新顺序，LRU 退化成普通 Map；容量 ≤ 0 未校验。

---

## 限时练习建议

| 题号 | 建议限时 | 优先讲清的点 |
| ---- | -------- | ------------ |
| Q1–Q2 | 8 分钟 | 选型差异 + cancel |
| Q3 | 15 分钟 | 循环引用与类型表 |
| Q4–Q5 | 15 分钟 | 保序 / 槽位 |
| Q6–Q8 | 15 分钟 | API 完整性 |
| Q9 | 20 分钟 | track/trigger 口述 |
| Q10–Q12 | 15 分钟 | 与原生 API 对齐 |

写完每题用 30 秒口述：**时间复杂度、一个边界、一个和业务的联系**。
