import { GlyphSet } from './screen.js'

const rawGlyphs = `xxxx..
xx....
x.x...
x..x..
....x.
.....x

.......
.x...x.
..x.x..
...x...
..x.x..
.x...x.
.......

.......
xxxxxx.
x....x.
x...xxx
x....x.
x......
x......
xxxxxx.

.......
..x....
.xx....
xxxxxxx
.xx....
..x....
.......

.......
....x..
....xx.
xxxxxxx
....xx.
....x..
.......

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

xxxxx
x...x
x...x
x...x
x...x
x...x
xxxxx

.....
.....
.....
.....
.....
.....
.....

..x..
..x..
..x..
..x..
.....
.....
..x..

.x.x.
.x.x.
.x.x.
.....
.....
.....
.....

.x.x.
.x.x.
xxxxx
.x.x.
xxxxx
.x.x.
.x.x.

.....
.....
.....
.....
.....
.....
.....

xx...
xx..x
...x.
..x..
.x...
x..xx
...xx

.x...
x.x..
x.x..
.x...
x.x.x
x..x.
.xx.x

..x..
..x..
..x..
.....
.....
.....
.....

...x.
..x..
.x...
.x...
.x...
..x..
...x.

.x...
..x..
...x.
...x.
...x.
..x..
.x...

.....
..x..
x.x.x
.xxx.
x.x.x
..x..
.....

.....
..x..
..x..
xxxxx
..x..
..x..
.....

.....
.....
.....
.....
.xx..
..x..
.x...

.....
.....
.....
xxxxx
.....
.....
.....

.....
.....
.....
.....
.....
.xx..
.xx..

.....
....x
...x.
..x..
.x...
x....
.....

.xxx.
x...x
x..xx
x.x.x
xx..x
x...x
.xxx.

..x..
.xx..
..x..
..x..
..x..
..x..
.xxx.

.xxx.
x...x
....x
...x.
..x..
.x...
xxxxx

xxxxx
...x.
..x..
...x.
....x
x...x
.xxx.

...x.
..xx.
.x.x.
x..x.
xxxxx
...x.
...x.

xxxxx
x....
xxxx.
....x
....x
x...x
.xxx.

..xx.
.x...
x....
xxxx.
x...x
x...x
.xxx.

xxxxx
....x
...x.
..x..
.x...
.x...
.x...

.xxx.
x...x
x...x
.xxx.
x...x
x...x
.xxx.

.xxx.
x...x
x...x
.xxxx
....x
...x.
.xx..

.....
.xx..
.xx..
.....
.xx..
.xx..
.....

.....
.xx..
.xx..
.....
.xx..
..x..
.x...

...x.
..x..
.x...
x....
.x...
..x..
...x.

.....
.....
xxxxx
.....
xxxxx
.....
.....

.x...
..x..
...x.
....x
...x.
..x..
.x...

.xxx.
x...x
....x
...x.
..x..
.....
..x..

.xxx.
x...x
x.x.x
x.xxx
x.x..
x....
.xxxx

.xxx.
x...x
x...x
xxxxx
x...x
x...x
x...x

xxxx.
x...x
x...x
xxxx.
x...x
x...x
xxxx.

.xxx.
x...x
x....
x....
x....
x...x
.xxx.

xxxx.
x...x
x...x
x...x
x...x
x...x
xxxx.

xxxxx
x....
x....
xxxx.
x....
x....
xxxxx

xxxxx
x....
x....
xxxx.
x....
x....
x....

.xxx.
x...x
x....
x.xxx
x...x
x...x
.xxxx

x...x
x...x
x...x
xxxxx
x...x
x...x
x...x

.xxx.
..x..
..x..
..x..
..x..
..x..
.xxx.

..xxx
...x.
...x.
...x.
...x.
x..x.
.xx..

x...x
x..x.
x.x..
xx...
x.x..
x..x.
x...x

x....
x....
x....
x....
x....
x....
xxxxx

x...x
xx.xx
x.x.x
x.x.x
x...x
x...x
x...x

x...x
x...x
xx..x
x.x.x
x..xx
x...x
x...x

.xxx.
x...x
x...x
x...x
x...x
x...x
.xxx.

xxxx.
x...x
x...x
xxxx.
x....
x....
x....

.xxx.
x...x
x...x
x...x
x.x.x
x..x.
.xx.x

xxxx.
x...x
x...x
xxxx.
x.x..
x..x.
x...x

.xxxx
x....
x....
.xxx.
....x
....x
xxxx.

xxxxx
..x..
..x..
..x..
..x..
..x..
..x..

x...x
x...x
x...x
x...x
x...x
x...x
.xxx.

x...x
x...x
x...x
x...x
.x.x.
.x.x.
..x..

x...x
x...x
x...x
x.x.x
x.x.x
x.x.x
.x.x.

x...x
x...x
.x.x.
..x..
.x.x.
x...x
x...x

x...x
x...x
x...x
.x.x.
..x..
..x..
..x..

xxxxx
....x
...x.
..x..
.x...
x....
xxxxx

..xx.
.x..x
x...x
xxxxx
x...x
x..x.
.xx..

.....
x....
.x...
..x..
...x.
....x
.....

.xx..
..x..
..x..
..x..
..x..
..x..
.xx..

..x..
.x.x.
x...x
.....
.....
.....
.....

.....
.....
.....
.....
.....
.....
xxxxx

..x..
..x..
...x.
.....
.....
.....
.....

.....
.....
.xxx.
....x
.xxxx
x...x
.xxxx

x....
x....
x.xx.
xx..x
x...x
x...x
xxxx.

.....
.....
.xxx.
x....
x....
x...x
.xxx.

....x
....x
.xx.x
x..xx
x...x
x...x
.xxxx

.....
.....
.xxx.
x...x
xxxxx
x....
.xxx.

..xx.
.x..x
.x...
xxx..
.x...
.x...
.x...

.....
.xxxx
x...x
x...x
.xxxx
....x
.xxx.

x....
x....
x.xx.
xx..x
x...x
x...x
x...x

..x..
.....
.xx..
..x..
..x..
..x..
.xxx.

...x.
.....
..xx.
...x.
...x.
x..x.
.xx..

.x...
.x...
.x..x
.x.x.
.xx..
.x.x.
.x..x

.xx..
..x..
..x..
..x..
..x..
..x..
.xxx.

.....
.....
xx.x.
x.x.x
x.x.x
x...x
x...x

.....
.....
x.xx.
xx..x
x...x
x...x
x...x

.....
.....
.xxx.
x...x
x...x
x...x
.xxx.

.....
.....
xxxx.
x...x
xxxx.
x....
x....

.....
.....
.xx.x
x..xx
.xxxx
....x
....x

.....
.....
x.xx.
xx..x
x....
x....
x....

.....
.....
.xxx.
x....
.xxx.
....x
xxxx.

.x...
.x...
xxx..
.x...
.x...
.x..x
..xx.

.....
.....
x...x
x...x
x...x
x..xx
.xx.x

.....
.....
x...x
x...x
x...x
.x.x.
..x..

.....
.....
x...x
x...x
x.x.x
x.x.x
.x.x.

.....
.....
x...x
.x.x.
..x..
.x.x.
x...x

.....
.....
x...x
x...x
.xxxx
....x
.xxx.

.....
.....
xxxxx
...x.
..x..
.x...
xxxxx

...xx
..x..
..x..
.x...
..x..
..x..
...xx

..x..
..x..
..x..
..x..
..x..
..x..
..x..

xx...
..x..
..x..
...x.
..x..
..x..
xx...

.....
.x...
x.x.x
...x.
.....
.....
.....

xxxxx
xxxxx
x...x
xxxxx
x...x
xxxxx
xxxxx

.....
.....
.xxx.
.x.x.
.x.x.
.x.x.
.xxx.

.....
.....
..x..
.xx..
..x..
..x..
..x..

.....
.....
.xx..
...x.
..x..
.x...
.xxx.

.....
.....
.xx..
...x.
..x..
...x.
.xx..

.....
.....
.x...
.x.x.
.xxx.
...x.
...x.

.....
.....
.xxx.
.x...
.xx..
...x.
.xx..

.....
.....
..xx.
.x...
.xxx.
.x.x.
.xxx.

.....
.....
.xxx.
...x.
..x..
.x...
.x...

.....
.....
.xxx.
.x.x.
.xxx.
.x.x.
.xxx.

.....
.....
.xxx.
.x.x.
.xxx.
...x.
.xx..

...x.
..x..
.xxx.
x...x
x...x
xxxxx
x...x

.x...
..x..
.xxx.
x...x
x...x
xxxxx
x...x

..x..
.x.x.
.....
.xxx.
x...x
xxxxx
x...x

.x.x.
.....
.xxx.
x...x
x...x
xxxxx
x...x

...x.
..x..
.xxx.
....x
.xxxx
x...x
.xxxx

.x...
..x..
.xxx.
....x
.xxxx
x...x
.xxxx

..x..
.x.x.
.xxx.
....x
.xxxx
x...x
.xxxx

.x.x.
.....
.xxx.
....x
.xxxx
x...x
.xxxx

...x.
..x..
xxxxx
x....
xxxx.
x....
xxxxx

.x...
..x..
xxxxx
x....
xxxx.
x....
xxxxx

..x..
.x.x.
xxxxx
x....
xxxx.
x....
xxxxx

.x.x.
.....
xxxxx
x....
xxxx.
x....
xxxxx

...x.
..x..
.xxx.
x...x
xxxxx
x....
.xxx.

.x...
..x..
.xxx.
x...x
xxxxx
x....
.xxx.

..x..
.xxx.
.xxx.
x...x
xxxxx
x....
.xxx.

.x.x.
.....
.xxx.
x...x
xxxxx
x....
.xxx.

...x.
..x..
.xxx.
..x..
..x..
..x..
.xxx.

.x...
..x..
.xxx.
..x..
..x..
..x..
.xxx.

..x..
.x.x.
.xxx.
..x..
..x..
..x..
.xxx.

.x.x.
.....
.xxx.
..x..
..x..
..x..
.xxx.

...x.
..x..
.....
.xx..
..x..
..x..
.xxx.

.x...
..x..
.....
.xx..
..x..
..x..
.xxx.

..x..
.x.x.
.....
.xx..
..x..
..x..
.xxx.

.x.x.
.....
.....
.xx..
..x..
..x..
.xxx.

...x.
..x..
.xxx.
x...x
x...x
x...x
.xxx.

.x...
..x..
.xxx.
x...x
x...x
x...x
.xxx.

..x..
.xxx.
.xxx.
x...x
x...x
x...x
.xxx.

.x.x.
.....
.xxx.
x...x
x...x
x...x
.xxx.

...x.
..x..
.....
.xxx.
x...x
x...x
.xxx.

.x...
..x..
.....
.xxx.
x...x
x...x
.xxx.

..x..
.x.x.
.....
.xxx.
x...x
x...x
.xxx.

.x.x.
.....
.....
.xxx.
x...x
x...x
.xxx.

...x.
..x..
x...x
x...x
x...x
x...x
.xxx.

.x...
..x..
x...x
x...x
x...x
x...x
.xxx.

..x..
.x.x.
.....
x...x
x...x
x...x
.xxx.

.x.x.
.....
x...x
x...x
x...x
x...x
.xxx.

...x.
..x..
x...x
x...x
x...x
x..xx
.xx.x

.x...
..x..
x...x
x...x
x...x
x..xx
.xx.x

..x..
.x.x.
.....
x...x
x...x
x..xx
.xx.x

.x.x.
.....
x...x
x...x
x...x
x..xx
.xx.x

.xxx.
x...x
x....
x...x
.xxx.
..x..
xxx..

.....
.....
.xxx.
x....
x...x
.xxx.
xxx..

..x.x
.x.x.
x...x
xx..x
x.x.x
x..xx
x...x

..x.x
.x.x.
.....
x.xx.
xx..x
x...x
x...x

....x
...x.
..x..
.....
.....
.....
.....

x....
.x...
..x..
.....
.....
.....
.....

.....
.x.x.
.....
.....
.....
.....
.....

..x..
.....
..x..
.x...
x....
x...x
.xxx.

..x..
..x..
.....
..x..
..x..
..x..
..x..

.....
.....
.xx.x
x..x.
x..x.
x..x.
.xx.x

..xx.
.x..x
.x..x
.xxx.
.x..x
.x..x
x.xx.

.....
.....
.x..x
x.x.x
...x.
...x.
...x.

.....
.....
.....
..x..
.x.x.
x...x
xxxxx

..xx.
.x...
..x..
...x.
.xxxx
x...x
.xxx.

.....
.....
.xxx.
x....
xxxx.
x....
.xxx.

..xx.
..x..
..x..
..x..
..x..
..x..
..xx.

.....
.x...
..x..
...x.
..xx.
.x..x
x...x

.....
.....
x..x.
x..x.
x..x.
xxx.x
x....

.....
.....
xxxxx
.x.x.
.x.x.
.x.x.
x..xx

.....
..xx.
.x..x
.x..x
.xxx.
.x...
x....

xxxxx
.x...
..x..
...x.
..x..
.x...
xxxxx

.....
.....
.xxxx
x..x.
x..x.
x..x.
.xx..

.....
.....
.xxxx
x.x..
..x..
..x.x
...x.

..x..
..x..
.xxx.
x.x.x
.xxx.
..x..
..x..

.xxx.
x...x
x...x
x...x
.x.x.
.x.x.
xx.xx

xxxxx
.....
x...x
.x.x.
..x..
.x.x.
x...x

xxxxx
.....
x...x
x...x
.xxxx
....x
.xxx.

..x.x
...x.
..x.x
.....
.....
.....
.....

.....
.....
.....
.....
.....
.....
x.x.x

.....
...x.
..xx.
.xxx.
..xx.
...x.
.....

.....
.....
xxx..
xxx..
xxx..
.....
.....

...x.
...x.
...x.
..x..
.x...
.x...
.x...

.....
.....
.....
.xxx.
.....
.....
.....

.xxx.
...x.
.xxx.
.x...
.xxx.
.....
.....

.xxx.
.x.x.
.xxx.
.....
.....
.....
.....

.xx..
...x.
..x..
...x.
.xx..
.....
.....

.....
.....
.....
.....
.....
.....
.....

.x...
.....
xx...
.x...
.x...
.x.x.
..x..

..x..
.x.x.
xxxx.
x...x
xxxx.
x....
x....

x....
.x..x
.x.x.
..x..
.x.x.
x..x.
....x

xxxxx
x...x
x.x..
xxx..
x.x..
x....
x....

.....
.....
.xxx.
x...x
xxxx.
x....
.xx..

.....
.....
..x..
..x..
..x..
..x..
..xxx

x...x
xx..x
xxx.x
xxxxx
x.xxx
x..xx
x...x

x.x..
.x.x.
..x.x
..x.x
..x.x
.x.x.
x.x..

.....
.x...
xxx..
xxxx.
xxx..
.x...
.....

xxxxx
xxxxx
xxxxx
xxxxx
xxxxx
xxxxx
xxxxx

xxxxx
xx.xx
x...x
.x.x.
xx.xx
xx.xx
xx.xx

xxxxx
xx.xx
x.x.x
x...x
x.x.x
x.x.x
xxxxx

xxxxx
xx.xx
xxx.x
xx..x
x.x.x
xx..x
xxxxx

.....
.....
.....
.....
.....
.....
xxxxx

..x..
.xxx.
x.x.x
..x..
..x..
.....
xxxxx

..x..
.xxx.
.xxx.
.x.x.
.x.x.
.....
xxxxx

..x..
...x.
..xx.
.x.x.
..xx.
.....
xxxxx

.....
.....
.x...
..x..
...x.
....x
.....

xx...
xxx..
.xxx.
..xxx
...xx
....x
.....

xxxxx
.xxxx
..xxx
...xx
....x
.....
.....

.....
.....
x....
xx...
xxx..
xxxx.
xxxxx

.....
...x.
..x.x
xxx.x
..x.x
...x.
.....

.....
..x..
.x.x.
.x.x.
.x.x.
..x..
.....

.....
x....
.....
..x..
.....
....x
.....

..x..
.xxx.
xxxxx
.xxx.
.xxx.
.xxx.
.....

.....
.xxx.
.xxx.
.xxx.
xxxxx
xxxx.
xxx..

x.x.x
.x.x.
x.x.x
.x.x.
x.x.x
.x.x.
x.x.x

..x..
.xxxx
xxx..
.xxx.
..xxx
xxxx.
..x..

..x..
.xxx.
xxxxx
.xxx.
.xxx.
.....
.....

.xx..
x..x.
x..x.
x.xx.
x...x
x...x
x.xx.

.....
.....
.....
.....
x...x
x...x
xxxxx

.....
....x
...xx
..xx.
.xx..
xx...
x....

x.x.x
.....
x...x
.....
x...x
.....
x.x.x
`

const processedGlyphs = rawGlyphs
    .split("\n\n")
    .map((g) => g.split("\n").map((l) => [...l].map((c) => c == "x")))

console.log(processedGlyphs)

let defaultGlyphSet = new GlyphSet()
for(let i = 0; i < processedGlyphs.length; i++) {
    defaultGlyphSet.set(i, processedGlyphs[i])
}

export { defaultGlyphSet }