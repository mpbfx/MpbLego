# LEGO 编辑器关键代码讲解（逐点定位）

> 目标：为“原子功能拆分”的每一点补充关键代码入口，便于面试时快速定位与讲解。

## A. 编辑器入口与页面骨架
1. **编辑器页面路由入口**
   - 路由定义：`/editor/:id` 指向 `Editor.vue`。  
   - 关键文件：`src/routes/index.ts`
2. **编辑器整体布局与面板分区**
   - 三栏布局与面板结构：`Editor.vue` 模板。  
   - 关键文件：`src/views/Editor.vue`

## B. 组件创建与上画布
3. **从组件列表添加文本组件**
   - 组件列表点击：`ComponentsList.vue` 的 `onItemClick`。  
   - 关键文件：`src/components/ComponentsList.vue`
4. **图片上传并生成图片组件**
   - 上传成功回调：`onImageUploaded`（创建 `l-image`）。  
   - 读取尺寸：`getImageDimensions`。  
   - 关键文件：`src/components/ComponentsList.vue`, `src/helper.ts`
5. **添加组件到画布**
   - mutation：`addComponent`（设置 `layerName`、push history）。  
   - 关键文件：`src/store/editor.ts`

## C. 画布渲染与选中
6. **画布渲染组件列表**
   - `Editor.vue` 里 `v-for` 渲染 `EditWrapper` + 业务组件。  
   - 关键文件：`src/views/Editor.vue`
7. **选中元素并联动右侧面板**
   - `EditWrapper` 触发 `setActive`。  
   - getter：`getCurrentElement`。  
   - 关键文件：`src/components/EditWrapper.vue`, `src/store/editor.ts`

## D. 组件移动与尺寸调整
8. **拖拽移动组件**
   - `startMove` 监听 `mousedown/mousemove/mouseup`。  
   - 更新位置：`update-position` 事件回到 `Editor.vue`。  
   - 关键文件：`src/components/EditWrapper.vue`, `src/views/Editor.vue`
9. **拖拽缩放组件**
   - `startResize` 计算宽高/位移并提交。  
   - 关键文件：`src/components/EditWrapper.vue`

## E. 属性编辑与表单映射
10. **属性面板分组**
    - `EditGroup` 计算基础属性 + 分组。  
    - 关键文件：`src/components/EditGroup.vue`
11. **属性表单动态渲染**
    - `PropsTable` 结合 `propsMap` 生成表单。  
    - 关键文件：`src/components/PropsTable.tsx`, `src/propsMap.tsx`
12. **属性变更写回 store**
    - 表单 change -> `updateComponent`。  
    - 关键文件：`src/components/PropsTable.tsx`, `src/store/editor.ts`

## F. 图层管理
13. **图层列表渲染与排序**
    - `vuedraggable`：`LayerList.vue`。  
    - 关键文件：`src/components/LayerList.vue`
14. **图层显隐/锁定**
    - `isHidden/isLocked` 更新。  
    - 关键文件：`src/components/LayerList.vue`, `src/store/editor.ts`
15. **图层名称内联编辑**
    - `InlineEdit` 输入/回滚逻辑。  
    - 关键文件：`src/components/InlineEdit.vue`

## G. 历史记录与撤销/重做
16. **新增/删除/修改历史记录**
    - `pushHistory` 与 `pushModifyHistory`。  
    - 关键文件：`src/store/editor.ts`
17. **撤销/重做操作**
    - `undo/redo` 处理 add/delete/modify。  
    - 关键文件：`src/store/editor.ts`
18. **防抖合并修改历史**
    - `pushHistoryDebounce`（`debounceChange`）。  
    - 关键文件：`src/store/editor.ts`

## H. 快捷键与上下文菜单
19. **快捷键复制/粘贴/删除/移动**
    - `hotKeys` 中的快捷键绑定。  
    - 关键文件：`src/plugins/hotKeys.ts`
20. **右键菜单操作**
    - `contextMenu` 初始化与删除动作。  
    - 关键文件：`src/plugins/contextMenu.ts`, `src/components/createContextMenu.ts`

## I. 保存/预览/发布
21. **手动保存与自动保存**
    - `useSaveWork` 组装 payload + 定时保存。  
    - 关键文件：`src/hooks/useSaveWork.ts`
22. **离开路由的保存提示**
    - `onBeforeRouteLeave` + `Modal.confirm`。  
    - 关键文件：`src/hooks/useSaveWork.ts`
23. **预览面板与二维码**
    - `PreviewForm` 中 `previewURL` 与二维码生成。  
    - 关键文件：`src/views/editor/PreviewForm.vue`
24. **发布流程**
    - `usePublishWork` 截图上传、发布、拉渠道。  
    - 关键文件：`src/hooks/usePublishWork.ts`
25. **渠道管理与复制链接**
    - `PublishForm` 创建渠道、复制链接。  
    - 关键文件：`src/views/editor/PublishForm.vue`

## J. 页面级配置
26. **页面标题内联编辑**
    - `InlineEdit` 触发 `updatePage`。  
    - 关键文件：`src/views/Editor.vue`, `src/store/editor.ts`
27. **页面属性配置**
    - `PropsTable` 修改 `page.props`。  
    - 关键文件：`src/views/Editor.vue`, `src/components/PropsTable.tsx`
