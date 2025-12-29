# Hot100（JS版本）

### 写在前面的话
如果有时间后面可能会出讲解视频和动画思路 因为我个人也在想能不能用一套通解解决所有的算法

比如 一样的套路a 能解决20道  套路b能解决30 套路c能解决20

这样背 3-5 个模板就能解决大部分算法题了 我一向的初心的要么不做 要么做好 所以大家可以期待一下

### 哈希
#### NO.1 两数之和 
```javascript
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const map = new Map();
    for(let i = 0;i<nums.length;i++){
        if(map.has(target-nums[i])){
            return [map.get(target-nums[i]),i];
        }else{
            map.set(nums[i],i);
        }
    }
};
```

#### NO.49 字母异位词分组
```javascript
/**
 * @param {string[]} strs
 * @return {string[][]}
 */
var groupAnagrams = function(strs) {
    let map = new Map();
    for(let i=0;i<strs.length;i++){
        let str = strs[i];
        let every = str.split('').sort().join('');
        if(map.has(every)){
            map.get(every).push(strs[i]);
        }else{
            map.set(every,[strs[i]]);
        }
    }
    return [...map.values()];
};
```

#### NO.128 最长连续序列
```javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
var longestConsecutive = function(nums) {
    if(nums.length===0){
        return 0;
    }
    let set = new Set();
    for(let i=0;i<nums.length;i++){
        set.add(nums[i]);
    }
    let len = 1;
    for(let every of set){
        if(!set.has(every-1)){
            let count = every;
            while(set.has(every+1)){
                every++;
            }
            len = Math.max(len,every-count+1);
        }
    }
    return len;  
};
```

### 双指针
#### NO.283 移动0
```javascript
/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var moveZeroes = function(nums) {
    let len = 0;
    for(let i=0;i<nums.length;i++){
        if(nums[i]!=0){
            let temp = nums[len];
            nums[len++] = nums[i];
            nums[i] = temp;
        }
    }
};
```

#### NO.11 盛最多的水
```javascript
/**
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {
    let left = 0;
    let right = height.length - 1;
    let res = 0;
    while(left < right){
        res = Math.max((right-left)* Math.min(height[left],height[right]),res);
        if(height[left]<height[right]){
            left ++;
        }else{
            right--;
        }
    } 
    return res;
};
```

#### NO.15 三数之和
```javascript
/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
    let ret = [];
    nums.sort((a,b)=>a-b);
    for(let i=0;i<nums.length-2;i++){
        if(i>=0 && nums[i]===nums[i-1]) continue;
        let left = i+1;
        let right = nums.length-1;
        if(nums[i] + nums[i+1] +nums[i+2] >0) break;
        if(nums[right-2] + nums[right] +nums[right-1] < 0) break;
        while(left<right){
            if(nums[left] + nums[right] + nums[i] === 0){
                ret.push([nums[i],nums[left++],nums[right--]]);
                while(nums[left-1] === nums[left]) left++;
                while(nums[right+1] === nums[right]) right--;
            }else if(nums[left] + nums[right] + nums[i] < 0){
                left++;
            }else{
                right--;
            }
        }
    }
    return ret;
};
```

#### NO.42 接雨水
```javascript
/**
 * @param {number[]} height
 * @return {number}
 */
var trap = function(height) {
  let temp = [];
  let sum = 0;
  for(let i=0;i<height.length;i++){
    while(temp.length!==0 && height[temp[temp.length-1]]<height[i]){
      let peek = temp.pop();
      if( temp.length!==0 ){
        let w = i-temp[temp.length-1] -1;
        let h = Math.min(height[temp[temp.length-1]],height[i])-height[peek];
        sum += w * h;
      }
    }
    temp.push(i);
  }
  return sum;
};
```





### 滑动窗口
#### NO.3 无重复字符的最长子串
```javascript
/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    let map = new Map();
    let left = 0;
    let right = 0;
    let res = 0;
    while(left<=right && right<s.length){
        let r = s.charAt(right);
        if(map.has(r)){
            map.set(r,map.get(r)+1);
        }else{
            map.set(r,1);
        }
        right++;
        while(map.has(r) && map.get(r)>1){
            let l = s.charAt(left);
            map.set(l,map.get(l)-1);
            left++;
        }
        res = Math.max(res,right-left);
    }
    return res;
};
```

#### NO.438 找到字符串中所有字母易位词
```javascript
/**
 * @param {string} s
 * @param {string} p
 * @return {number[]}
 */
var findAnagrams = function(s, p) {
    if(s.length<p.length){
        return [];
    }

    function convert(numsa,numsb){
        for(let i=0;i<numsa.length;i++){
            if(numsa[i]!==numsb[i]){
                return false;
            }
        }
        return true;
    }

    let res = [];
    let _s = new Array(26).fill(0);
    let _p = new Array(26).fill(0);

    for(let i=0;i<p.length;i++){
        _s[s.charAt(i).charCodeAt(0)-'a'.charCodeAt(0)]++;
        _p[p.charAt(i).charCodeAt(0)-'a'.charCodeAt(0)]++;
    }

    if(convert(_s,_p)){
        res.push(0);
    }

    for(let i=p.length;i<s.length;i++){
        _s[s.charAt(i).charCodeAt(0)-'a'.charCodeAt(0)]++;
        _s[s.charAt(i-p.length).charCodeAt(0)-'a'.charCodeAt(0)]--;
        if(convert(_s,_p)){
            res.push(i-p.length+1);
        }
    }
    return res;
};


```



### 子串
#### NO.560 和为K的子数组
```javascript
var subarraySum = function(nums, k) {
    let count = 0;
    for (let start = 0; start < nums.length; ++start) {
        let sum = 0;
        for (let end = start; end >= 0; --end) {
            sum += nums[end];
            if (sum == k) {
                count++;
            }
        }
    }
    return count;
};
```

#### NO.239 滑动窗口最大值
```javascript
/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
var maxSlidingWindow = function(nums, k) {
    const n = nums.length;
    const q = [];
    for (let i = 0; i < k; i++) {
        while (q.length && nums[i] >= nums[q[q.length - 1]]) {
            q.pop();
        }
        q.push(i);
    }

    const ans = [nums[q[0]]];
    for (let i = k; i < n; i++) {
        while (q.length && nums[i] >= nums[q[q.length - 1]]) {
            q.pop();
        }
        q.push(i);
        while (q[0] <= i - k) {
            q.shift();
        }
        ans.push(nums[q[0]]);
    }
    return ans;
};
```

#### NO.76 最小覆盖子串
```javascript
/**
 * @param {string} s
 * @param {string} t
 * @return {string}
 */
function isCovered(cntS, cntT) {
    for (let i = 'A'.charCodeAt(0); i <= 'Z'.charCodeAt(0); i++) {
        if (cntS[i] < cntT[i]) {
            return false;
        }
    }
    for (let i = 'a'.charCodeAt(0); i <= 'z'.charCodeAt(0); i++) {
        if (cntS[i] < cntT[i]) {
            return false;
        }
    }
    return true;
}

var minWindow = function(s, t) {
    const cntS = Array(128).fill(0); 
    const cntT = Array(128).fill(0); 
    for (const c of t) {
        cntT[c.codePointAt(0)]++;
    }

    const m = s.length;
    let ansLeft = -1, ansRight = m;
    let left = 0;
    for (let right = 0; right < m; right++) { 
        cntS[s[right].codePointAt(0)]++; 
        while (isCovered(cntS, cntT)) { 
            if (right - left < ansRight - ansLeft) { 
                ansLeft = left; 
                ansRight = right;
            }
            cntS[s[left].codePointAt(0)]--; 
            left++;
        }
    }
    return ansLeft < 0 ? "" : s.substring(ansLeft, ansRight + 1);
};
```

### 普通数组
#### NO.53 最大子数组和
```javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    let sum = 0;
    let max = -Infinity;
    for(let i=0;i<nums.length;i++){
        let num = nums[i];
        sum = sum > 0 ? sum + num : num;
        max = Math.max(max,sum);
    }
    return max;
};
```

#### NO.56 合并区间
```javascript
/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
var merge = function(intervals) {
    if(intervals.length<=1){
        return intervals;
    }
    intervals.sort((a,b)=>a[0]-b[0]);
    let res = [];
    let l = intervals[0][0];
    let r = intervals[0][1];

    for(let i=1;i<intervals.length;i++){
        let currentl = intervals[i][0];
        let currentr = intervals[i][1];

        if(currentl<=r){
            r = Math.max(r,currentr);
        }else{
            res.push([l,r]);
            l = currentl;
            r = currentr;
        }
    }
    res.push([l,r]);
    return res;
};
```

#### NO.189 轮转数组
```javascript
/**
 * @param {number[]} nums
 * @param {number} k
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var rotate = function(nums, k) {
    k = k % nums.length;
    if(k===0){
        return;
    }

    function reverse(nums,left,right){
        while(left<right){
            let temp = nums[left];
            nums[left++] = nums[right];
            nums[right--] = temp;
        }
    }

    reverse(nums,0,nums.length-1);
    reverse(nums,0,k-1);
    reverse(nums,k,nums.length-1);
};
```

#### NO.238 除自身数组外数组的乘积
```javascript
/**
 * @param {number[]} nums
 * @return {number[]}
 */
var productExceptSelf = function(nums) {
    let len = nums.length-1;
    let pre = new Array(len).fill(0);
    let suf = new Array(len).fill(0);

    let _pre = 1;
    let _suf = 1; 
    for(let i=0;i<nums.length;i++){
        _pre *= nums[i];
        pre[i] = _pre;

        _suf *= nums[nums.length-i-1];
        suf[nums.length-i-1] = _suf;
    }

    let res = new Array(len).fill(0);
    for(let i=0;i<nums.length;i++){
        let p = i === 0 ? 1 : pre[i-1];
        let s = i === nums.length-1 ? 1 : suf[i+1];
        res[i] = p * s;
    }
    return res;
};
```

#### NO.41 缺失的第一个正数
```javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
var firstMissingPositive = function(nums) {
    const n = nums.length;
    for (let i = 0; i < n; i++) {
        while (1 <= nums[i] && nums[i] <= n && nums[i] !== nums[nums[i] - 1]) {
            const j = nums[i] - 1;
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
    }

    for (let i = 0; i < n; i++) {
        if (nums[i] !== i + 1) {
            return i + 1;
        }
    }

    return n + 1;
};
```

### 矩阵
#### NO.73 矩阵置零
```javascript
/**
 * @param {number[][]} matrix
 * @return {void} Do not return anything, modify matrix in-place instead.
 */
var setZeroes = function(matrix) {
    let setX = new Set();
    let setY = new Set();
    for(let i=0;i<matrix.length;i++){
        for(let j=0;j<matrix[i].length;j++){
            if(!matrix[i][j]){
                setY.add(i);
                setX.add(j);
            }
        }
    }

    for(let i=0;i<matrix.length;i++){
        for(let j=0;j<matrix[i].length;j++){
            if(setX.has(j) || setY.has(i)){
                matrix[i][j] = 0;
            }
        }
    }
};
```

#### NO.54 螺旋矩阵
```javascript
/**
 * @param {number[][]} matrix
 * @return {number[]}
 */
var spiralOrder = function(matrix) {
    let l = 0;
    let t = 0;
    let r = matrix[0].length - 1;
    let b = matrix.length - 1;

    let res = []
    while(1){
        for(let i=l;i<=r;i++){
            res.push(matrix[t][i]);
        }
        if(++t>b) break;
        for(let i=t;i<=b;i++){
            res.push(matrix[i][r]);
        }
        if(--r<l) break;
        for(let i=r;i>=l;i--){
            res.push(matrix[b][i]);
        }
        if(--b<t) break;
        for(let i=b;i>=t;i--){
            res.push(matrix[i][l]);
        }
        if(++l>r) break;
    }
    return res;
};
```

#### NO.48 旋转图像
```javascript
/**
 * @param {number[][]} matrix
 * @return {void} Do not return anything, modify matrix in-place instead.
 */
var rotate = function(matrix) {
    let n = matrix.length;
    let _i = Math.floor(n/2);
    let _j = Math.floor((n+1)/2);
    for(let i=0;i<_i;i++){
        for(let j=0;j<_j;j++){
            let temp = matrix[i][j];
            matrix[i][j] = matrix[n-1-j][i];
            matrix[n-1-j][i] = matrix[n-1-i][n-1-j];
            matrix[n-1-i][n-1-j] = matrix[j][n-1-i];
            matrix[j][n-1-i] = temp;
        }
    }
};
```

#### NO.240 搜索二维矩阵
```javascript
/**
 * @param {number[][]} matrix
 * @param {number} target
 * @return {boolean}
 */
var searchMatrix = function(matrix, target) {
    let i = 0;
    let j = matrix[0].length - 1 ;

    while(i>=0 && i<matrix.length && j>=0 && j < matrix[0].length){
        if(matrix[i][j] === target){
            return true;
        }else if(matrix[i][j]<target){
            i++;
        }else{
            j--;
        }
    }  
    return false;
};
```

### 链表
#### NO.160 相交链表
```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} headA
 * @param {ListNode} headB
 * @return {ListNode}
 */
var getIntersectionNode = function(headA, headB) {
    if(headA === null || headB === null){
        return null;
    }
    let _A_count = 0;
    let _A = headA;
    while(_A !== null){
        _A_count ++;
        _A = _A.next;
    }

    let _B_count = 0;
    let _B = headB;
    while(_B !== null){
        _B_count ++;
        _B = _B.next;
    }

    let k = Math.abs(_A_count - _B_count);
    if(_A_count < _B_count){
        while(k-->0){
            headB = headB.next;
        }
    }else{
        while(k-->0){
            headA = headA.next;
        }
    }
    while(headA!=null && headB!=null){
        if(headA===headB){
            return headA;
        }else{
            headA = headA.next;
            headB = headB.next;
        }
    }
    return null;
};
```

#### NO.206 反转链表
```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var reverseList = function(head) {
    if(head === null || head.next === null){
        return head === null ? null : head;
    }
    let res = null;
    while(head !== null){
        let temp = head.next;
        head.next = res;
        res = head;
        head = temp;
    }
    return res;
};
```

#### NO.234 回文链表
```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {boolean}
 */
var isPalindrome = function(head) {
    let count = 0;
    let temp = head;
    while(temp!=null){
        count ++;
        temp = temp.next;
    }

    let half = Math.floor(count/2);
    let num = [];
    let _head = head;
    for(let i=0;i<count;i++){
        if(i<half){
            num.push(_head.val);
            _head = _head.next;
        }else if(count%2 === 1 && i === half){
            _head = _head.next;
            continue;
        }else{
            if(_head.val!==num.pop()){
                return false;
            }
            _head = _head.next;
        }
    }
    return true;
};
```

#### NO.141 环形链表
```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} head
 * @return {boolean}
 */
var hasCycle = function(head) {
    if(head===null || head.next === null || head.next.next === null){
        return false;
    }
    let slow = head.next;
    let fast = head.next.next;

    while(slow!==fast){
        if(slow.next!==null){
            slow = slow.next;
        }else{
            return false;
        }

        if(fast!==null && fast.next !==null && fast.next.next!== null){
            fast = fast.next.next;
        }else{
            return false;
        }
    }
    return true;
};
```

#### NO.142 环形链表2
```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var detectCycle = function(head) {
    if(head === null || head.next === null || head.next.next === null){
        return null;
    }
    let slow = head.next;
    let fast = head.next.next;

    while(slow!==fast){
        if(slow.next !== null){
            slow = slow.next;
        }else{
            return null;
        }

        if(fast!==null && fast.next!==null && fast.next.next !==null ){
            fast = fast.next.next;
        }else{
            return null;
        }
    }

    fast = head;
    while(fast !== slow){
        slow = slow.next;
        fast = fast.next;
    }
    return fast;
};
```

#### NO.21 合并两个有序列表
```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
var mergeTwoLists = function(list1, list2) {
    if(list1===null || list2===null){
        return list1===null ? list2 : list1;
    }
    let _list1 = list1;
    let _list2 = list2;
    let res = new ListNode();
    let copy = res;
    while(_list1!=null && _list2!==null){
        if(_list1.val<_list2.val){
            res.next = _list1;
            res = res.next;
            _list1 = _list1.next;
        }else{
            res.next = _list2;
            res = res.next;
            _list2 = _list2.next;
        }
    }
    if(_list1==null){
        res.next = _list2;
    }else{
        res.next = _list1;
    }
    return copy.next;
};
```

#### NO.2 两数相加
```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
var addTwoNumbers = function(l1, l2) {
    let _l1 = l1;
    let _l2 = l2;
    let res = new ListNode();
    let copy = res;
    let current = 0;
    while(_l1 !== null || _l2 !== null || current !== 0){
        let first = _l1 === null ? 0 : _l1.val;
        let second = _l2 === null ? 0 : _l2.val;
        let temp = new ListNode((first+second+current)%10);
        res.next = temp;
        res = temp;
        current = Math.floor((first + second + current)/10);
        if(_l1!== null){
            _l1 = _l1.next;
        }
        if(_l2!==null){
            _l2 = _l2.next;
        }
    } 
    return copy.next;
};
```

#### NO.19 删除倒数第n个节点
```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @param {number} n
 * @return {ListNode}
 */
var removeNthFromEnd = function(head, n) {
    let count = 0;
    let temp = head;
    while(temp!==null){
        count ++;
        temp = temp.next;
    }

    temp = new ListNode();
    temp.next = head;
    let res = temp;
    for(let i=0;i<count-n;i++){
        temp = temp.next;
    }
    temp.next = temp.next.next;
    return res.next;
};
```

#### NO.24 两两交换链表节点
```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var swapPairs = function(head) {
    let temp = new ListNode();
    temp.next = head;
    let res = temp;

    while(temp !==null && temp.next !==null && temp.next.next !== null){
        let first = temp.next;
        let second = temp.next.next;

        temp.next = first.next;
        first.next = second.next;
        second.next = first;

        temp = temp.next.next;
    }
    return res.next;
};
```

#### NO.25 K个一组反转链表
```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @param {number} k
 * @return {ListNode}
 */
const myReverse = (head, tail) => {
    let prev = tail.next;
    let p = head;
    while (prev !== tail) {
        const nex = p.next;
        p.next = prev;
        prev = p;
        p = nex;
    }
    return [tail, head];
}
var reverseKGroup = function(head, k) {
    const hair = new ListNode(0);
    hair.next = head;
    let pre = hair;

    while (head) {
        let tail = pre;
        for (let i = 0; i < k; ++i) {
            tail = tail.next;
            if (!tail) {
                return hair.next;
            }
        }
        const nex = tail.next;
        [head, tail] = myReverse(head, tail);
        pre.next = head;
        tail.next = nex;
        pre = tail;
        head = tail.next;
    }
    return hair.next;
};
```

#### NO.148 排序链表
```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var sortList = function(head) {
    const map = new Map();
    const set = new Set();

    let _head = head;
    while(_head!==null){
        if(map.has(_head.val)){
            map.get(_head.val).push(_head);
        }else{
            map.set(_head.val,[_head]);
        }
        set.add(_head.val);
        _head = _head.next;
    }

    let sort = Array.from(set.values());
    sort = sort.sort((a,b)=>a-b);

    let temp = new ListNode();
    let res = temp;

    for(let item of sort){
        let now = [...map.get(item)]
        for(let every of now){
            temp.next = every;
            every.next = null;
            temp = every;
        }
    }
    return res.next;
};
```



#### NO.23 合并K个升序链表
```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode[]} lists
 * @return {ListNode}
 */
var mergeKLists = function(lists) {
    const pq = new MinPriorityQueue(node => node.val);
    for (const head of lists) {
        if (head) {
            pq.enqueue(head);
        }
    }

    const dummy = new ListNode();
    let cur = dummy;
    while (!pq.isEmpty()) { 
        const node = pq.dequeue(); 
        if (node.next) {
            pq.enqueue(node.next); 
        }
        cur.next = node;
        cur = cur.next;
    }
    return dummy.next;
};
```

### 二叉树
#### NO.94 二叉树的中序遍历
```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[]}
 */
var inorderTraversal = function(root) {
    function inorder(root,res){
        if(root===null){
            return;
        }
        if(root.left!==null){
            inorder(root.left,res);
        }
        res.push(root.val);
        if(root.right!==null){
            inorder(root.right,res);
        }
    }
    let res = [];
    inorder(root,res);
    return res;
};
```

#### NO.104 二叉树的最大深度
```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
var maxDepth = function(root) {
    if(root===null){
        return 0;
    }
    return Math.max(maxDepth(root.left),maxDepth(root.right))+1;
};
```

#### NO.226 反转二叉树
```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {TreeNode}
 */
var invertTree = function(root) {
    if(root===null){
        return null;;
    }

    let _left = invertTree(root.left);
    let _right = invertTree(root.right);

    root.left = _right;
    root.right = _left;

    return root;
};
```

#### NO.101 对称二叉树
```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {boolean}
 */
var isSymmetric = function(root) {
    function isSym(left,right){
        if(left === null && right === null){
            return true;
        }else if(left ===null ||  right===null){
            return false;
        }

        if(left.val !== right.val){
            return false;
        }
        
        if(isSym(left.left,right.right) && isSym(left.right,right.left)){
            return true;
        }else{
            return false;
        }
    }
    return isSym(root.left,root.right);
};
```

#### NO.534 二叉树的直径
```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
var diameterOfBinaryTree = function(root) {
    function diameter(root){
        if(root===null){
            return [0,0];
        }

        let l = diameter(root.left);
        let r = diameter(root.right);

        let ll = root.left === null ? 0 : 1;
        let rr = root.right === null ? 0 : 1;

        let d = Math.max(l[1]+r[1]+ll+rr,l[0],r[0]);
        let h = Math.max(l[1]+ll,r[1]+rr);

        return [d,h];
    }  
    return diameter(root)[0];
};
```

#### NO.102 二叉树的层序遍历
```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
var levelOrder = function(root) {
    let res = [];
    if(root==null){
        return res;
    }

    let stack = [];
    stack.push(root);
    stack.push(new TreeNode(Infinity,null,null));
    
    let temp = [];
    while(stack.length !== 1){
        let every = stack.shift();
        
        if(every.val === Infinity){
            let copy = temp.slice(0);
            res.push(copy);
            temp = [];
            stack.push(new TreeNode(Infinity,null,null));
        }else{
            temp.push(every.val);
        }
        if(every.left!==null){
            stack.push(every.left);
        }
        if(every.right!==null){
            stack.push(every.right);
        }
    }
    res.push(temp);
    return res;
};
```

#### NO.108 有序数组转换为二叉树
```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {number[]} nums
 * @return {TreeNode}
 */
var sortedArrayToBST = function(nums) {
    function dfs(nums,low,high){
        if(low>high){
            return null;
        }
        let mid = Math.floor((low+high)/2);
        let left = dfs(nums,low,mid-1);
        let right = dfs(nums,mid+1,high);
        let root = new TreeNode(nums[mid],left,right);
        return root;
    }
    return dfs(nums,0,nums.length-1);
};
```

#### NO.98 验证二叉搜索树
```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {boolean}
 */
var isValidBST = function(root) {
    function isValid(root,left,right){
        if(root === null){
            return true;
        }
        let x = root.val;
        return left<x && x<right && isValid(root.left,left,x) && isValid(root.right,x,right);
    }
    return isValid(root,-Infinity,Infinity);
};
```

#### NO.230 二叉搜索树第k小
```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @param {number} k
 * @return {number}
 */
var kthSmallest = function(root, k) {
    let temp = [];
    while(temp.length !== 0 || root !==null){
        while(root!==null){
            temp.push(root);
            root = root.left;
        }
        let mid = temp.pop();
        if(--k===0){
            return mid.val;
        }
        root = mid.right;
    }  
};
```

#### NO.199 二叉树的右视图
```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[]}
 */
var rightSideView = function(root) {
    let res = [];
    if(root===null){
        return res;
    }
    let stack = [];
    stack.push(root);
    while(stack.length !== 0){
        let n = stack.length;
        for(let i=0;i<n;i++){
            let temp = stack.shift();
            if(i===n-1){
                res.push(temp.val);
            }
            if(temp.left !== null){
                stack.push(temp.left);
            }
            if(temp.right !== null){
                stack.push(temp.right);
            }
        }
    }
    return res;
};
```

#### NO.114 二叉树展开为数组
```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {void} Do not return anything, modify root in-place instead.
 */
var flatten = function(root){
    while(root!==null){
        if(root.left===null){
            root = root.right;
        }else{
            let left = root.left;
            while(left.right!==null){
                left = left.right;
            }
            left.right = root.right;
            root.right = root.left;
            root.left = null;
            root = root.right;
        }
    }
};
```

#### NO.105 前中序构造二叉树
```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {number[]} preorder
 * @param {number[]} inorder
 * @return {TreeNode}
 */
var buildTree = function(preorder, inorder) {
    let map = new Map();
    for(let i=0;i<inorder.length;i++){
        map.set(inorder[i],i);
    }
    let root = 0;
    let left = 0;
    let right = inorder.length-1;

    function build(preorder,map,root,left,right){
        if(left>right){
            return null;
        }
        let val = preorder[root];
        let loc = map.get(val);
        let l = build(preorder,map,root+1,left,loc-1);
        let r = build(preorder,map,root+loc-left+1,loc+1,right);
        return new TreeNode(val,l,r);
    }

    return build(preorder,map,root,left,right);
};
```

### 图论
#### NO.200 岛屿数量
```javascript
/**
 * @param {character[][]} grid
 * @return {number}
 */
var numIslands = function(grid) {
    let count = 0;
    
    function dfs(grid,i,j){    
        if(i>=0 && i<grid.length && j>=0 && j<grid[0].length){
            if(grid[i][j] === "1"){
                grid[i][j] = 0;
                dfs(grid,i-1,j);
                dfs(grid,i,j-1);
                dfs(grid,i+1,j);
                dfs(grid,i,j+1);
            }
        }
    }

    for(let i=0;i<grid.length;i++){
        for(let j=0;j<=grid[0].length;j++){
            if(grid[i][j]==="1"){
                dfs(grid,i,j);
                count++;
            }
        }
    }
    return count;
};
```

#### NO.994 腐烂的橘子
```javascript
/**
 * @param {number[][]} grid
 * @return {number}
 */
var orangesRotting = function(grid) {
    const R = grid.length, C = grid[0].length;
    const dr = [-1, 0, 1, 0];
    const dc = [0, -1, 0, 1];
    const queue = [];
    const depth = new Map();
    
    for (let r = 0; r < R; ++r) {
        for (let c = 0; c < C; ++c) {
            if (grid[r][c] === 2) {
                const code = r * C + c;
                queue.push(code);
                depth.set(code, 0);
            }
        }
    }
    
    let ans = 0;
    while (queue.length !== 0) {
        const code = queue.shift();
        const r = Math.floor(code / C), c = code % C;
        for (let k = 0; k < 4; ++k) {
            const nr = r + dr[k];
            const nc = c + dc[k];
            if (0 <= nr && nr < R && 0 <= nc && nc < C && grid[nr][nc] === 1) {
                grid[nr][nc] = 2;
                const ncode = nr * C + nc;
                queue.push(ncode);
                depth.set(ncode, depth.get(code) + 1);
                ans = depth.get(ncode);
            }
        }
    }
    
    const freshOrangesCount = grid.reduce((acc, row) => acc + row.reduce((acc, v) => acc + (v === 1 ? 1 : 0), 0), 0);
    return freshOrangesCount > 0 ? -1 : ans;
};
```

#### NO.207 课程表
```javascript
/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @return {boolean}
 */
const canFinish = (numCourses, prerequisites) => {
  const inDegree = new Array(numCourses).fill(0); 
  const map = {};                            
  for (let i = 0; i < prerequisites.length; i++) {
    inDegree[prerequisites[i][0]]++;      
    if (map[prerequisites[i][1]]) {      
      map[prerequisites[i][1]].push(prerequisites[i][0]); 
    } else {                                 
      map[prerequisites[i][1]] = [prerequisites[i][0]];
    }
  }
  const queue = [];
  for (let i = 0; i < inDegree.length; i++) { 
    if (inDegree[i] == 0) queue.push(i);
  }
  let count = 0;
  while (queue.length) {
    const selected = queue.shift();       
    count++;                                
    const toEnQueue = map[selected];        
    if (toEnQueue && toEnQueue.length) {   
      for (let i = 0; i < toEnQueue.length; i++) {
        inDegree[toEnQueue[i]]--;          
        if (inDegree[toEnQueue[i]] == 0) {   
          queue.push(toEnQueue[i]);
        }
      }
    }
  }
  return count == numCourses; 
};
```

#### NO.208 实现前缀树
```javascript
var Trie = function() {
    this.children = {};
};

Trie.prototype.insert = function(word) {
    let node = this.children;
    for (const ch of word) {
        if (!node[ch]) {
            node[ch] = {};
        }
        node = node[ch];
    }
    node.isEnd = true;
};

Trie.prototype.searchPrefix = function(prefix) {
    let node = this.children;
    for (const ch of prefix) {
        if (!node[ch]) {
            return false;
        }
        node = node[ch];
    }
    return node;
}

Trie.prototype.search = function(word) {
    const node = this.searchPrefix(word);
    return node !== undefined && node.isEnd !== undefined;
};

Trie.prototype.startsWith = function(prefix) {
    return this.searchPrefix(prefix);
};
```

### 回溯
#### NO.46 全排列
```javascript
/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var permute = function(nums) {
    function per(nums,idx,res){
        if(idx === nums.length-1){
            let temp = nums.slice(0);
            res.push(temp);
        }
        for(let i=idx;i<nums.length;i++){
            [nums[i],nums[idx]] = [nums[idx],nums[i]];
            per(nums,idx+1,res);
            [nums[i],nums[idx]] = [nums[idx],nums[i]];
        }
    }
    let res = [];
    per(nums,0,res);
    return res;
};
```

#### NO.78 子集
```javascript
/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var subsets = function(nums) {
    let res = [];
    for(let i=0;i<Math.pow(2,nums.length);i++){
        const t = []
        for(let j=0;j<nums.length;j++){
            if(i & (1 << j)){
               t.push(nums[j]);
            }
        }
        res.push(t);
    }
    return res;
};
```

#### NO.17 电话号码的字母组合
```javascript
const MAPPING = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];

var letterCombinations = function(digits) {
    const n = digits.length;
    if (n === 0) {
        return [];
    }

    const path = Array(n); 
    const ans = [];

    function dfs(i) {
        if (i === n) {
            ans.push(path.join(""));
            return;
        }
        const letters = MAPPING[Number(digits[i])];
        for (const c of letters) {
            path[i] = c;
            dfs(i + 1);
        }
    }

    dfs(0);
    return ans;
};
```

#### NO.39 组合总和
```javascript
/**
 * @param {number[]} candidates
 * @param {number} target
 * @return {number[][]}
 */
var combinationSum = function(candidates, target) {
    const ans = [];
    const dfs = (target, combine, idx) => {
        if (idx === candidates.length) {
            return;
        }
        if (target === 0) {
            ans.push(combine);
            return;
        }
        dfs(target, combine, idx + 1);
        if (target - candidates[idx] >= 0) {
            dfs(target - candidates[idx], [...combine, candidates[idx]], idx);
        }
    }

    dfs(target, [], 0);
    return ans;
};
```

#### NO.22 括号生成
```javascript
/**
 * @param {number} n
 * @return {string[]}
 */
var generateParenthesis = function(n) {
    const ans = [];
    const path = Array(n * 2); 


    function dfs(left, right) {
        if (right === n) {
            ans.push(path.join('')); 
            return;
        }
        if (left < n) {
            path[left + right] = '(';
            dfs(left + 1, right);
        }
        if (right < left) { 
            path[left + right] = ')';
            dfs(left, right + 1);
        }
    }

    dfs(0, 0);
    return ans;
};
```



#### NO.79 单词搜索
```javascript
/**
 * @param {character[][]} board
 * @param {string} word
 * @return {boolean}
 */
var exist = function(board, word) {
    const m = board.length, n = board[0].length;
    function dfs(i, j, k) {
        if (board[i][j] !== word[k]) {
            return false;
        }
        if (k + 1 === word.length) {
            return true; 
        }
        board[i][j] = 0;
        for (const [x, y] of [[i, j - 1], [i, j + 1], [i - 1, j], [i + 1, j]]) { 
            if (0 <= x && x < m && 0 <= y && y < n && dfs(x, y, k + 1)) {
                return true;
            }
        }
        board[i][j] = word[k];
        return false; 
    }
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (dfs(i, j, 0)) {
                return true; 
            }
        }
    }
    return false;
};
```

#### NO.131 分割回文串
```javascript
/**
 * @param {string} s
 * @return {string[][]}
 */
var partition = function(s) {
    const dfs = (i) => {
        if (i === n) {
            ret.push(ans.slice());
            return;
        }
        for (let j = i; j < n; ++j) {
            if (f[i][j]) {
                ans.push(s.slice(i, j + 1));
                dfs(j + 1);
                ans.pop();
            }
        }
    }
    
    const n = s.length;
    const f = new Array(n).fill(0).map(() => new Array(n).fill(true));
    let ret = [], ans = [];
    
    for (let i = n - 1; i >= 0; --i) {
        for (let j = i + 1; j < n; ++j) {
            f[i][j] = (s[i] === s[j]) && f[i + 1][j - 1];
        }
    }
    dfs(0);
    return ret;
};
```

### 二分查找
#### NO.35 搜索插入位置
```javascript
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var searchInsert = function(nums, target) {
    if(target < nums[0] || target > nums[nums.length-1]){
        return target < nums[0] ? 0 : nums.length;
    }

    let left = 0;
    let right = nums.length-1;
    while(left<=right){
        let mid = Math.floor((left+right)/2);
        if(nums[mid]<target){
            left = mid + 1;
        }else if(nums[mid]>target){
            right = mid - 1;
        }else{
            return mid;
        }
    }
    return left;
};
```

#### NO.74 搜索二维矩阵
```javascript
/**
 * @param {number[][]} matrix
 * @param {number} target
 * @return {boolean}
 */
var searchMatrix = function(matrix, target) {
    let i = 0 ;
    let j = matrix[0].length - 1;
    while(i<matrix.length && j>=0){
        if(matrix[i][j]<target){
            i++;
        }else if(matrix[i][j]>target){
            j--;
        }else{
            return true;
        }
    }
    return false;
};
```

#### NO.34 排序数组中查找元素第一个位置和最后一个位置
```javascript
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
const binarySearch = (nums, target, lower) => {
    let left = 0, right = nums.length - 1, ans = nums.length;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] > target || (lower && nums[mid] >= target)) {
            right = mid - 1;
            ans = mid;
        } else {
            left = mid + 1;
        }
    }
    return ans;
}

var searchRange = function(nums, target) {
    let ans = [-1, -1];
    const leftIdx = binarySearch(nums, target, true);
    const rightIdx = binarySearch(nums, target, false) - 1;
    if (leftIdx <= rightIdx && rightIdx < nums.length && nums[leftIdx] === target && nums[rightIdx] === target) {
        ans = [leftIdx, rightIdx];
    } 
    return ans;
};
```

#### NO.33 搜索排序旋转数组
```javascript
var findMin = function(nums) {
    let left = -1, right = nums.length - 1; 
    while (left + 1 < right) { 
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] < nums[nums.length - 1]) {
            right = mid;
        } else {
            left = mid;
        }
    }
    return right;
};

var lowerBound = function(nums, left, right, target) {
    while (left + 1 < right) { 
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] >= target) {
            right = mid; 
        } else {
            left = mid;
        }
    }
    return nums[right] === target ? right : -1;
};

var search = function(nums, target) {
    const i = findMin(nums);
    if (target > nums[nums.length - 1]) { 
        return lowerBound(nums, -1, i, target); 
    }

    return lowerBound(nums, i - 1, nums.length, target); 
};
```

#### NO.153 寻找排序旋转数组的最小值
```javascript
var findMin = function(nums) {
    let low = 0;
    let high = nums.length - 1;
    while (low < high) {
        const pivot = low + Math.floor((high - low) / 2);
        if (nums[pivot] < nums[high]) {
            high = pivot;
        } else {
            low = pivot + 1;
        }
    }
    return nums[low];
};
```

#### NO.4 寻找两个正序数组的中位数
```javascript
/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
var findMedianSortedArrays = function(a, b) {
    if (a.length > b.length) {
        [a, b] = [b, a]; 
    }

    const m = a.length, n = b.length;
    a = [-Infinity, ...a, Infinity];
    b = [-Infinity, ...b, Infinity];

    let i = 0, j = Math.floor((m + n + 1) / 2);
    while (true) {
        if (a[i] <= b[j + 1] && a[i + 1] > b[j]) {
            const max1 = Math.max(a[i], b[j]); 
            const min2 = Math.min(a[i + 1], b[j + 1]);
            return (m + n) % 2 ? max1 : (max1 + min2) / 2;
        }
        i++; // 继续枚举
        j--;
    }
};
```

### 栈
#### NO.20 有效的括号
```javascript
var isValid = function(s) {
    const n = s.length;
    if (n % 2 === 1) {
        return false;
    }
    const pairs = new Map([
        [')', '('],
        [']', '['],
        ['}', '{']
    ]);
    const stk = [];
    for (let ch of s){
        if (pairs.has(ch)) {
            if (!stk.length || stk[stk.length - 1] !== pairs.get(ch)) {
                return false;
            }
            stk.pop();
        } 
        else {
            stk.push(ch);
        }
    };
    return !stk.length;
};
```

#### NO.155 最小栈
```javascript
var MinStack = function() {
    this.x_stack = [];
    this.min_stack = [Infinity];
};

MinStack.prototype.push = function(x) {
    this.x_stack.push(x);
    this.min_stack.push(Math.min(this.min_stack[this.min_stack.length - 1], x));
};

MinStack.prototype.pop = function() {
    this.x_stack.pop();
    this.min_stack.pop();
};

MinStack.prototype.top = function() {
    return this.x_stack[this.x_stack.length - 1];
};

MinStack.prototype.getMin = function() {
    return this.min_stack[this.min_stack.length - 1];
};
```

#### NO.394 字符串解码
```javascript
var decodeString = function(s) {
	if (s.length === 0) {
		return s;
	}

	if ('a' <= s[0] && s[0] <= 'z') {
		return s[0] + decodeString(s.slice(1));
	}

	const i = s.indexOf('[');
	let balance = 1; 
	for (let j = i + 1; ; j++) {
		if (s[j] === '[') {
			balance++;
		} else if (s[j] === ']') {
			balance--;
			if (balance === 0) { 
				const k = parseInt(s.slice(0, i));
				return decodeString(s.slice(i + 1, j)).repeat(k) + decodeString(s.slice(j + 1));
			}
		}
	}
};
```

#### NO.739 每日温度
```javascript
var dailyTemperatures = function(temperatures) {
    const n = temperatures.length;
    const ans = Array(n).fill(0);
    const st = [];
    for (let i = n - 1; i >= 0; i--) {
        const t = temperatures[i];
        while (st.length && t >= temperatures[st[st.length - 1]]) {
            st.pop();
        }
        if (st.length) {
            ans[i] = st[st.length - 1] - i;
        }
        st.push(i);
    }
    return ans;
};
```

### 堆
#### NO.215 数组中的第K大个元素
```javascript
function partition(nums, left, right) {
    const idx = left + Math.floor(Math.random() * (right - left + 1));
    const pivot = nums[idx];
    [nums[idx], nums[left]] = [nums[left], nums[idx]];
    let i = left + 1, j = right;
    while (true) {
        while (i <= j && nums[i] < pivot) {
            i++;
        }
        while (i <= j && nums[j] > pivot) {
            j--;
        }

        if (i >= j) {
            break;
        }

        [nums[i], nums[j]] = [nums[j], nums[i]];
        i++;
        j--;
    }
  
    [nums[left], nums[j]] = [nums[j], nums[left]];

    return j;
}

var findKthLargest = function(nums, k) {
    const n = nums.length;
    const targetIndex = n - k;
    let left = 0, right = n - 1;
    while (true) {
        const i = partition(nums, left, right);
        if (i === targetIndex) {
            return nums[i];
        }
        if (i > targetIndex) {
            right = i - 1;
        } else {
            left = i + 1;
        }
    }
};
```

#### NO.347 前k个高频元素
```javascript
var topKFrequent = function(nums, k) {
    const cnt = new Map();
    for (const x of nums) {
        cnt.set(x, (cnt.get(x) ?? 0) + 1);
    }
    const maxCnt = Math.max(...cnt.values());

    const buckets = Array.from({ length: maxCnt + 1 }, () => []);
    for (const [x, c] of cnt.entries()) {
        buckets[c].push(x);
    }

    const ans = [];
    for (let i = maxCnt; i >= 0 && ans.length < k; i--) {
        ans.push(...buckets[i]);
    }
    return ans;
};
```

### 贪心算法
#### NO.121 买卖股票的最佳时机
```javascript
var maxProfit = function(prices) {
    let ans = 0;
    let minPrice = prices[0];
    for (const p of prices) {
        ans = Math.max(ans, p - minPrice);
        minPrice = Math.min(minPrice, p);
    }
    return ans;
};
```

#### NO.55 跳跃游戏
```javascript
var canJump = function(nums) {
    let mx = 0;
    for (let i = 0; mx < nums.length - 1; i++) {
        if (i > mx) { 
            return false;
        }
        mx = Math.max(mx, i + nums[i]);
    }
    return true;
};
```



#### NO.45 跳跃游戏2
```javascript
var jump = function(nums) {
    let position = nums.length - 1;
    let steps = 0;
    while (position > 0) {
        for (let i = 0; i < position; i++) {
            if (i + nums[i] >= position) {
                position = i;
                steps++;
                break;
            }
        }
    }
    return steps;
};
```

### 动态规划
#### NO.70 爬楼梯
```javascript
/**
 * @param {number} n
 * @return {number}
 */
var climbStairs = function(n) {
    if(n===1) return 1;
    if(n===2) return 2;
    let num = [];
    num.push(0);
    num.push(1);
    num.push(2);
    for(let i=3;i<=n;i++){
        num[i] = num[i-1]+num[i-2];
    }
    return num[n];
};
```

#### NO.118 杨辉三角
```javascript
/**
 * @param {number} numRows
 * @return {number[][]}
 */
var generate = function(numRows) {
    let ret = [];

    let first = [1];
    ret.push(first);
    if(numRows==1){
        return ret;
    }

    let second = [1,1];
    ret.push(second);
    if(numRows==2){
        return ret;
    }

    for(let i=3;i<=numRows;i++){
        let every = [1];
        let last = ret[i-2];
        for(let j=1;j<i-1;j++){
            every.push(last[j-1]+last[j]);
        }
        every.push(1);
        ret.push(every);
    }
    return ret;
};
```

#### NO.198 打家劫舍
```javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
var rob = function(nums) {
    if(nums.length===1){
        return nums[0];
    }else if(nums.length===2){
        return Math.max(nums[0],nums[1]);
    }
    let ribbon = [];
    ribbon.push(nums[0]);
    ribbon.push(Math.max(nums[0],nums[1]));

    for(let i=2;i<nums.length;i++){
        ribbon.push(Math.max(ribbon[i-1],ribbon[i-2]+nums[i]));
    }
    return ribbon[nums.length-1];
};
```

#### NO.279 完全平方数
```javascript
/**
 * @param {number} n
 * @return {number}
 */
var numSquares = function(n) {
    let xlen = Math.floor(Math.sqrt(n));
    let temp = [];
    for(let i=0;i<=xlen;i++){
        temp.push(i*i);
    }

    let result = new Array(n+1).fill(Infinity);
    result[0] = 0;
    for(let i=0;i<=n;i++){
        for(let j=1;i+temp[j]<=n && j<=xlen;j++){
            result[i+temp[j]] = Math.min(result[i+temp[j]],result[i]+1);
        }
    }
    return result[n];
};
```

#### NO.322 零钱兑换
```javascript
/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
var coinChange = function(coins, amount) {
    coins.sort((a,b)=>a-b);
    let target = new Array(amount + 1).fill(Infinity);
    target[0] = 0;
    for(let i=0;i<=amount;i++){
        if(target[i]===Infinity){
            continue;
        }
        for(let j=0;j<coins.length;j++){
            if(i+coins[j]<=amount){
                target[i+coins[j]] = Math.min(target[i+coins[j]],target[i]+1);
            }
        }
    }
    return target[amount]===Infinity? -1 : target[amount];
};
```

#### NO.139 单词拆分
```javascript
var wordBreak = function(s, wordDict) {
    const maxLen = Math.max(...wordDict.map(word => word.length));
    const words = new Set(wordDict);
    const memo = Array(s.length + 1);

    function dfs(i) {
        if (i === 0) { 
            return true;
        }
        if (memo[i] !== undefined) {
            return memo[i];
        }
        for (let j = i - 1; j >= Math.max(i - maxLen, 0); j--) {
            if (words.has(s.slice(j, i)) && dfs(j)) {
                return memo[i] = true; 
            }
        }
        return memo[i] = false;
    }

    return dfs(s.length);
};
```

#### NO.300 最长递增子序列
```javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
/**
 * @param {number[]} nums
 * @return {number}
 */
var lengthOfLIS = function(nums) {
    const dp = new Array(nums.length).fill(1);

    let maxLength = 1;

    for (let i = 1; i < nums.length; i++) {
        for (let j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        maxLength = Math.max(maxLength, dp[i]);
    }

    return maxLength;
};
```

#### NO.416 分割等和子串
```javascript
/**
 * @param {number[]} nums
 * @return {boolean}
 */
var canPartition = function(nums) {
    const n = nums.length;
    if (n < 2) {
        return false;
    }
    let sum = 0, maxNum = 0;
    for (const num of nums) {
        sum += num;
        maxNum = maxNum > num ? maxNum : num;
    }
    if (sum & 1) {
        return false;
    }
    const target = Math.floor(sum / 2);
    if (maxNum > target) {
        return false;
    }
    const dp = new Array(n).fill(0).map(() => new Array(target + 1, false));
    for (let i = 0; i < n; i++) {
        dp[i][0] = true;
    }
    dp[0][nums[0]] = true;
    for (let i = 1; i < n; i++) {
        const num = nums[i];
        for (let j = 1; j <= target; j++) {
            if (j >= num) {
                dp[i][j] = dp[i - 1][j] | dp[i - 1][j - num];
            } else {
                dp[i][j] = dp[i - 1][j];
            }
        }
    }
    return dp[n - 1][target];
};
```



### 多维动态规划
##### NO.72 编辑距离
```javascript
/**
 * @param {string} word1
 * @param {string} word2
 * @return {number}
 */
var minDistance = function(word1, word2) {
    let len_1 = word1.length;
    let len_2 = word2.length;
    
    if(len_1 * len_2 === 0){
        return len_2+len_1;
    }

    let dp = [];
    for(let i = 0;i<=len_1;i++){
        dp.push(Array.from(len_2+1));
    }

    for(let i=0;i<=len_1;i++){
        dp[i][0] = i;
    }

    for(let j=0;j<=len_2;j++){
        dp[0][j] = j;
    }

    for(let i=1;i<=len_1;i++){
        for(let j=1;j<=len_2;j++){
            let left = dp[i-1][j] + 1;
            let down = dp[i][j-1] + 1;
            let left_down = dp[i-1][j-1];
            if(word1.charAt(i-1).charCodeAt(0) !== word2.charAt(j-1).charCodeAt(0)){
                left_down += 1 ;
            }
            dp[i][j] = Math.min(left,Math.min(down,left_down));
        }
    }

    return dp[len_1][len_2];
};
```

##### NO.62 不同路径
```javascript
var uniquePaths = function(m, n) {
    const f = new Array(m).fill(0).map(() => new Array(n).fill(0));
    for (let i = 0; i < m; i++) {
        f[i][0] = 1;
    }
    for (let j = 0; j < n; j++) {
        f[0][j] = 1;
    }
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            f[i][j] = f[i - 1][j] + f[i][j - 1];
        }
    }
    return f[m - 1][n - 1];
};
```

##### NO.5 最长回文子串
```javascript
/**
 * @param {string} s
 * @return {string}
 */
var longestPalindrome = function(s) {
    if(s===null || s.length < 2){
        return s;
    }

    let strlen = s.length;
    let maxStart = 0;
    let maxEnd = 0;
    let maxLen = 1;

    let dp = [];
    for(let i=0;i<strlen;i++){
        dp.push(Array.from(strlen).fill(false))
    }

    for(let r=1;r<strlen;r++){
        for(let l=0;l<r;l++){
            if(s.charAt(r)===s.charAt(l) && (r-l<=2 || dp[l+1][r-1])){
                dp[l][r] = true;
                if(r-l+1>maxLen){
                    maxLen = r-l+1;
                    maxStart = l;
                    maxEnd = r;
                }
            }
        }
    }

    return s.substring(maxStart,maxEnd+1);
};
```

##### NO.1143 最长公共子序列
```javascript
var longestCommonSubsequence = function(text1, text2) {
    const m = text1.length, n = text2.length;
    const dp = new Array(m + 1).fill(0).map(() => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        const c1 = text1[i - 1];
        for (let j = 1; j <= n; j++) {
            const c2 = text2[j - 1];
            if (c1 === c2) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[m][n];
};
```

### 技巧
#### NO.136 只出现一次的数字
```javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
var singleNumber = function(nums) {
    let res = 0;
    for(let num of nums){
        res = res ^ num ;
    }
    return res;
};
```

#### NO.169 多数元素
```javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
var majorityElement = function(nums) {
    let conut = 0;
    let res = nums[0];

    for(let num of nums){
        if(conut<=0){
            res = num;
        }
        if(num===res){
            conut++;
        }else{
            conut--;
        }
    }
    return res;
};
```

#### NO.75 颜色分类
```javascript
/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var sortColors = function(nums) {
    let l = 0;
    let r = nums.length-1;
    for(let m = 0;m<=r;m++){
        if(nums[m]===0){
            nums[m]=nums[l];
            nums[l++] = 0;
        }else if(nums[m]===2){
            nums[m--]=nums[r];
            nums[r--] = 2;
        }
    }
};
```

#### NO.31 下一个排列
```javascript
/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var nextPermutation = function(nums) {
    const n = nums.length;

    let i = n - 2;
    while (i >= 0 && nums[i] >= nums[i + 1]) {
        i--;
    }
    if (i >= 0) {
        let j = n - 1;
        while (nums[j] <= nums[i]) {
            j--;
        }
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }

    let left = i + 1, right = n - 1;
    while (left < right) {
        [nums[left], nums[right]] = [nums[right], nums[left]];
        left++;
        right--;
    }
};
```

#### NO.287 寻找重复数
```javascript
var findDuplicate = function(nums) {
    const n = nums.length;
    let l = 1, r = n - 1, ans = -1;
    while (l <= r) {
        let mid = (l + r) >> 1;
        let cnt = 0;
        for (let i = 0; i < n; ++i) {
            cnt += nums[i] <= mid;
        }
        if (cnt <= mid) {
            l = mid + 1;
        } else {
            r = mid - 1;
            ans = mid;
        }
    }
    return ans;
};
```



#### 
#### 
#### 


> 更新: 2025-12-15 07:36:09  
> 原文: <https://www.yuque.com/u56987424/lwyx/phvbk3mow69k0zqe>