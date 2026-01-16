# LEGO 编辑器原子功能拆分（面试官可提问点）

> 目标：把编辑器拆成“可独立提问”的最小功能单元，便于准备面试。

## A. 编辑器入口与页面骨架
1. **编辑器页面路由入口**：`/editor/:id` 路由指向编辑器视图。  
   * 提问点：路由参数如何驱动加载作品？

```plantuml
@startuml
title 1. 编辑器页面路由入口
actor 用户
participant Router
participant EditorView
participant Store
participant API
用户 -> Router: 访问 /editor/:id
Router -> EditorView: 渲染 Editor.vue
activate EditorView
EditorView -> Store: onMounted 读取 route.params.id
Store -> API: dispatch fetchWork(id)
activate API
API --> Store: 返回作品数据
deactivate API
Store -> Store: mutation fetchWork
Store --> EditorView: page/components 更新
EditorView -> 用户: 渲染作品与画布
deactivate EditorView
@enduml
```

2. **编辑器整体布局与面板分区**：左侧组件库、中间画布、右侧属性/图层/页面面板。  
   * 提问点：如何组织三栏布局并与状态联动？

```plantuml
@startuml
title 2. 编辑器整体布局与面板分区
participant EditorView
participant ComponentsList
participant Canvas
participant RightPanel
EditorView -> ComponentsList: 传入默认模板数据
EditorView -> Canvas: 传入 components
EditorView -> RightPanel: 传入 currentElement/page
Canvas -> RightPanel: setActive 触发联动
RightPanel -> RightPanel: 根据 activePanel 切换 Tab
@enduml
```

## B. 组件创建与上画布
3. **从组件列表添加文本组件**：点击组件列表项，组装 `ComponentData` 并发出 `on-item-click`。  
   * 提问点：为何组件数据要带 `id/name/props`？

```plantuml
@startuml
title 3. 组件列表添加文本组件
actor 用户
participant ComponentsList
participant Store
participant Canvas
用户 -> ComponentsList: 点击文本组件
ComponentsList -> ComponentsList: 生成 uuid + 组合 props
ComponentsList -> Store: commit addComponent(ComponentData)
Store -> Store: 设置 layerName + pushHistory(add)
Store --> Canvas: components 更新
Canvas -> Canvas: 渲染新增组件
@enduml
```

4. **图片上传并生成图片组件**：上传成功后创建 `l-image` 组件，读取图片尺寸并设置宽度。  
   * 提问点：如何通过上传响应构建组件并限制宽度？

```plantuml
@startuml
title 4. 图片上传生成组件
actor 用户
participant Uploader
participant ComponentsList
participant Store
participant Canvas
用户 -> Uploader: 选择文件并上传
Uploader -> ComponentsList: 回传 resp.urls + File
ComponentsList -> ComponentsList: getImageDimensions(file)
ComponentsList -> ComponentsList: 计算 maxWidth 并设置 width
ComponentsList -> Store: commit addComponent(l-image)
Store --> Canvas: components 更新
Canvas -> Canvas: 渲染图片组件
@enduml
```

5. **添加组件到画布**：编辑器接收事件后 `commit('addComponent')` 写入 `components`。  
   * 提问点：新增组件时如何处理图层名/历史记录？

```plantuml
@startuml
title 5. 添加组件到画布
participant EditorView
participant Store
participant Canvas
EditorView -> Store: commit addComponent
Store -> Store: layerName = "图层" + length
Store -> Store: pushHistory(add, component)
Store --> EditorView: components 更新
EditorView -> Canvas: v-for 渲染新组件
@enduml
```

## C. 画布渲染与选中
6. **画布渲染组件列表**：`v-for` 渲染 `EditWrapper` + 业务组件，数据来自 `store`。  
   * 提问点：组件树如何跟随 `components` 响应式更新？

```plantuml
@startuml
title 6. 画布渲染组件列表
participant Store
participant EditorView
participant EditWrapper
participant Canvas
Store --> EditorView: components 响应式数据
EditorView -> Canvas: v-for 渲染 EditWrapper
Canvas -> EditWrapper: props/active/hidden
EditWrapper -> Canvas: slot 渲染业务组件
@enduml
```

7. **选中元素并联动右侧面板**：点击包装层触发 `setActive`，通过 getter 读 `currentElement`。  
   * 提问点：选中态如何影响属性编辑与图层高亮？

```plantuml
@startuml
title 7. 选中元素联动面板
actor 用户
participant EditWrapper
participant Store
participant RightPanel
participant LayerList
用户 -> EditWrapper: 点击组件
EditWrapper -> Store: commit setActive(id)
Store --> RightPanel: getter currentElement
RightPanel -> RightPanel: PropsTable/EditGroup 刷新
Store --> LayerList: selectedId 更新
LayerList -> 用户: 高亮当前图层
@enduml
```

## D. 组件移动与尺寸调整
8. **拖拽移动组件**：`EditWrapper` 监听 `mousedown/mousemove` 计算位置后更新。  
   * 提问点：如何计算画布内相对坐标并写回 store？

```plantuml
@startuml
title 8. 拖拽移动组件
actor 用户
participant EditWrapper
participant Store
用户 -> EditWrapper: mousedown 记录 gap
loop mousemove
  EditWrapper -> EditWrapper: 计算画布内坐标
  EditWrapper -> EditWrapper: 更新 DOM 样式
end
EditWrapper -> Store: mouseup commit updateComponent(left/top)
Store -> Store: pushHistory(modify)
Store --> EditWrapper: props 同步
@enduml
```

9. **拖拽缩放组件**：四个 resizer 节点计算宽高与位移并提交更新。  
   * 提问点：不同方向缩放如何影响 `top/left/width/height`？

```plantuml
@startuml
title 9. 拖拽缩放组件
actor 用户
participant Resizer
participant EditWrapper
participant Store
用户 -> Resizer: mousedown 拖拽
loop mousemove
  Resizer -> EditWrapper: 计算 width/height/top/left
  EditWrapper -> EditWrapper: 更新 DOM 样式
end
Resizer -> Store: mouseup commit updateComponent(size)
Store -> Store: pushHistory(modify)
Store --> EditWrapper: props 同步
@enduml
```

## E. 属性编辑与表单映射
10. **属性面板分组**：`EditGroup` 将属性按“尺寸/边框/阴影/位置/事件”等分组。  
    * 提问点：如何把“基础属性 + 预设分组”合并？

```plantuml
@startuml
title 10. 属性面板分组
participant EditGroup
participant PropsTable
EditGroup -> EditGroup: 计算 allNormalProps
EditGroup -> EditGroup: difference 得到基础属性
EditGroup -> EditGroup: 组装 newGroups
EditGroup -> PropsTable: 逐组渲染
PropsTable -> PropsTable: 生成表单字段
@enduml
```

11. **属性表单动态渲染**：`PropsTable` 通过 `propsMap` 转成表单配置并渲染。  
    * 提问点：属性到表单控件映射的策略是什么？

```plantuml
@startuml
title 11. 属性表单动态渲染
participant PropsTable
participant propsMap
PropsTable -> propsMap: 查找字段配置
propsMap --> PropsTable: component/extraProps/transform
PropsTable -> PropsTable: value initalTransform
PropsTable -> PropsTable: 绑定 onChange/afterTransform
PropsTable -> PropsTable: 渲染表单控件
@enduml
```

12. **属性变更写回 store**：表单 `change` 触发 `updateComponent` 更新 props。  
    * 提问点：如何支持单字段与多字段更新？

```plantuml
@startuml
title 12. 属性变更写回 store
actor 用户
participant PropsTable
participant Store
用户 -> PropsTable: 修改表单值
PropsTable -> PropsTable: afterTransform 处理
PropsTable -> Store: commit updateComponent(key/value)
Store -> Store: cachedOldValues + pushHistoryDebounce
Store --> PropsTable: props 更新
@enduml
```

## F. 图层管理
13. **图层列表渲染与排序**：`LayerList` 使用 `vuedraggable` 对图层排序。  
    * 提问点：拖拽排序和画布渲染之间如何保持一致？

```plantuml
@startuml
title 13. 图层列表渲染与排序
participant LayerList
participant Store
LayerList -> LayerList: vuedraggable 拖拽
LayerList -> Store: 更新 components 顺序
Store --> LayerList: 图层顺序更新
Store --> LayerList: 画布渲染顺序同步
@enduml
```

14. **图层显隐/锁定**：图层按钮更新 `isHidden/isLocked`。  
    * 提问点：锁定与隐藏的 UI/数据联动逻辑？

```plantuml
@startuml
title 14. 图层显隐/锁定
actor 用户
participant LayerList
participant Store
participant Canvas
用户 -> LayerList: 点击隐藏/锁定
LayerList -> Store: commit updateComponent(isHidden/isLocked)
Store --> LayerList: 图层状态更新
Store --> Canvas: hidden/locked 反映到渲染
@enduml
```

15. **图层名称内联编辑**：`InlineEdit` 支持点击编辑、Enter 保存、Esc 回滚。  
    * 提问点：如何用组合式 API 做可复用的内联编辑？

```plantuml
@startuml
title 15. 图层名称内联编辑
actor 用户
participant InlineEdit
participant Store
用户 -> InlineEdit: 点击进入编辑
InlineEdit -> InlineEdit: focus input
InlineEdit -> InlineEdit: Enter 保存/Esc 回滚
InlineEdit -> Store: commit updateComponent(layerName)
Store --> InlineEdit: 名称更新
@enduml
```

## G. 历史记录与撤销/重做
16. **新增/删除/修改历史记录**：`pushHistory` 记录 add/delete/modify。  
    * 提问点：历史记录里保存了哪些关键字段？

```plantuml
@startuml
title 16. 记录历史
participant Store
Store -> Store: add/delete/modify
Store -> Store: 生成 historyRecord
Store -> Store: pushHistory(type,data,index)
Store --> Store: histories 更新
Store --> Store: historyIndex 重置
@enduml
```

17. **撤销/重做操作**：`undo/redo` 按历史类型恢复状态。  
    * 提问点：如何处理“历史游标”与数组回退？

```plantuml
@startuml
title 17. 撤销/重做
actor 用户
participant Store
用户 -> Store: commit undo/redo
Store -> Store: 读取 historyIndex
Store -> Store: 按类型 restore
Store -> Store: historyIndex 更新
Store --> 用户: 画布更新
@enduml
```

18. **防抖合并修改历史**：`pushHistoryDebounce` 限制高频更新。  
    * 提问点：为什么要防抖，如何避免记录过多？

```plantuml
@startuml
title 18. 防抖合并修改历史
participant Store
participant Debounce
Store -> Debounce: updateComponent 触发
Debounce -> Debounce: 延迟合并
Debounce -> Store: pushHistory(modify)
Store -> Store: cachedOldValues 清理
@enduml
```

## H. 快捷键与上下文菜单
19. **快捷键复制/粘贴/删除/移动**：`hotKeys` 绑定 `ctrl+c/v`、方向键等。  
    * 提问点：如何把快捷键映射到 store mutation？

```plantuml
@startuml
title 19. 快捷键操作
actor 用户
participant HotKeys
participant Store
用户 -> HotKeys: 触发快捷键
HotKeys -> Store: commit copy/paste/delete/move
Store -> Store: 更新 components/currentElement
Store --> 用户: 画布更新
@enduml
```

20. **右键菜单操作**：`contextMenu` 初始化并绑定删除行为。  
    * 提问点：如何在不同区域挂载不同菜单？

```plantuml
@startuml
title 20. 右键菜单操作
actor 用户
participant ContextMenu
participant Store
用户 -> ContextMenu: 右键点击
ContextMenu -> Store: commit deleteComponent
Store -> Store: pushHistory(delete)
Store --> 用户: 组件移除
@enduml
```

## I. 保存/预览/发布
21. **手动保存与自动保存**：`useSaveWork` 负责保存 payload + 自动保存定时器。  
    * 提问点：保存 payload 中 content 的结构是什么？

```plantuml
@startuml
title 21. 手动保存与自动保存
participant EditorView
participant useSaveWork
participant Store
participant API
EditorView -> useSaveWork: 点击保存/定时触发
useSaveWork -> useSaveWork: 组装 payload
useSaveWork -> Store: dispatch saveWork(payload)
Store -> API: PATCH /works/:id
API --> Store: 保存成功
Store --> useSaveWork: isDirty=false
@enduml
```

22. **离开路由的保存提示**：`onBeforeRouteLeave` + `Modal.confirm`。  
    * 提问点：怎么保证离开前不丢数据？

```plantuml
@startuml
title 22. 离开路由保存提示
actor 用户
participant Router
participant useSaveWork
participant Store
participant API
用户 -> Router: 尝试离开
Router -> useSaveWork: onBeforeRouteLeave
useSaveWork -> 用户: Modal.confirm
用户 -> useSaveWork: 选择保存/不保存
alt 选择保存
  useSaveWork -> Store: dispatch saveWork
  Store -> API: PATCH /works/:id
  API --> Store: 保存成功
end
Router -> 用户: 继续导航
@enduml
```

23. **预览面板与二维码**：`PreviewForm` 生成预览链接与二维码。  
    * 提问点：preview URL 结构如何拼接？

```plantuml
@startuml
title 23. 预览面板与二维码
participant PreviewForm
participant Store
participant QRCode
PreviewForm -> Store: 读取 page 信息
PreviewForm -> PreviewForm: 拼接 preview URL
PreviewForm -> QRCode: 生成二维码
QRCode --> PreviewForm: 展示二维码
PreviewForm -> PreviewForm: 展示 iframe 预览
@enduml
```

24. **发布流程**：`usePublishWork` 截图上传、更新封面、发布作品、拉取渠道。  
    * 提问点：发布流程为何要先保存？

```plantuml
@startuml
title 24. 发布流程
participant usePublishWork
participant Uploader
participant Store
participant API
usePublishWork -> Uploader: 截图上传
Uploader --> usePublishWork: 返回封面 URL
usePublishWork -> Store: commit updatePage(coverImg)
usePublishWork -> Store: dispatch saveWork
Store -> API: PATCH /works/:id
API --> Store: 保存成功
usePublishWork -> Store: dispatch publishWork
Store -> API: POST /works/publish/:id
API --> Store: 发布成功
usePublishWork -> Store: dispatch fetchChannels
Store -> API: GET /channel/getWorkChannels/:id
API --> Store: channels 更新
@enduml
```

25. **渠道管理与复制链接**：`PublishForm` 生成渠道、二维码、复制链接。  
    * 提问点：如何动态生成渠道二维码并实现复制？

```plantuml
@startuml
title 25. 渠道管理与复制链接
actor 用户
participant PublishForm
participant Store
participant API
participant QRCode
participant Clipboard
用户 -> PublishForm: 创建渠道
PublishForm -> Store: dispatch createChannel
Store -> API: POST /channel/
API --> Store: 返回新渠道
Store --> PublishForm: channels 更新
PublishForm -> QRCode: 生成渠道二维码
用户 -> Clipboard: 点击复制链接
Clipboard --> 用户: 复制成功
@enduml
```

## J. 页面级配置
26. **页面标题内联编辑**：Header 通过 `InlineEdit` 修改标题并写入 `page`。  
    * 提问点：如何区分“页面属性”与“组件属性”？

```plantuml
@startuml
title 26. 页面标题内联编辑
actor 用户
participant InlineEdit
participant Store
用户 -> InlineEdit: 修改标题
InlineEdit -> Store: commit updatePage(title)
Store -> Store: isDirty=true
Store --> InlineEdit: 标题更新
@enduml
```

27. **页面属性配置**：`PropsTable` 直接编辑 `page.props`。  
    * 提问点：页面级属性和组件级属性的表单复用方式？

```plantuml
@startuml
title 27. 页面属性配置
actor 用户
participant PropsTable
participant Store
用户 -> PropsTable: 修改页面属性
PropsTable -> Store: commit updatePage(props)
Store -> Store: isDirty=true
Store --> PropsTable: 页面属性更新
@enduml
```

---

### 使用建议
- **每条原子功能**都可以拆成：
  1) 触发入口（UI/事件）  
  2) 数据流（store mutation/action）  
  3) 影响的 UI 或副作用（画布/面板/接口）
- 按照上述结构准备问答，可以快速定位到具体文件与函数。
