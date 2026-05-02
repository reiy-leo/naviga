# Naviga 项目指南

## 技术栈

- **React 19** - UI框架
- **Vite** - 构建工具
- **Tailwind CSS 3.4** - CSS框架
- **NextUI v2 (HeroUI前身)** - UI组件库
- **Zustand** - 状态管理
- **Lucide React** - 图标库
- **i18next** - 国际化

## NextUI v2 组件使用

### 可用组件

```jsx
import { 
  Button, 
  Card, 
  Modal, 
  Input,
  Select,
  Switch,
  Tabs,
  Tooltip,
  Chip,
  Divider,
  // ... 其他组件
} from "@nextui-org/react";
```

### 常用组件示例

#### Button
```jsx
<Button color="primary" variant="solid" onPress={handleClick}>
  点击我
</Button>

<Button isIconOnly variant="light">
  <Icon />
</Button>
```

#### Card
```jsx
<Card>
  <CardBody>
    内容
  </CardBody>
</Card>
```

#### Modal
```jsx
<Modal isOpen onClose={onClose}>
  <ModalContent>
    <ModalHeader>标题</ModalHeader>
    <ModalBody>内容</ModalBody>
  </ModalContent>
</Modal>
```

#### Input
```jsx
<Input
  label="标签"
  placeholder="提示文字"
  value={value}
  onValueChange={setValue}
/>
```

#### Select
```jsx
<Select
  label="选择"
  selectedKeys={[value]}
  onSelectionChange={handleChange}
>
  <SelectItem key="1">选项1</SelectItem>
  <SelectItem key="2">选项2</SelectItem>
</Select>
```

#### Tabs
```jsx
<Tabs selectedKey={activeTab} onSelectionChange={setActiveTab}>
  <Tab key="tab1" title="标签1">
    内容1
  </Tab>
  <Tab key="tab2" title="标签2">
    内容2
  </Tab>
</Tabs>
```

#### Switch
```jsx
<Switch 
  isSelected={enabled}
  onValueChange={setEnabled}
/>
```

#### Tooltip
```jsx
<Tooltip content="提示文字">
  <Button>悬停查看</Button>
</Tooltip>
```

## 样式指南

### Tailwind CSS + NextUI

项目使用Tailwind CSS配合NextUI主题系统：

```jsx
// 使用Tailwind类
<div className="flex items-center gap-4 p-4 bg-default-100 rounded-xl">

// 使用NextUI颜色变量
<div className="text-primary-500 bg-primary-100">

// 暗色模式适配
<div className="text-foreground bg-background dark:text-white">
```

### 颜色系统

- `primary` - 主色（indigo-500）
- `danger` - 危险/错误（red-500）
- `success` - 成功（green-500）
- `warning` - 警告（yellow-500）
- `default` - 默认（gray）

### 暗色模式

暗色模式通过`dark`类控制：

```jsx
<html className="dark">
  {/* 暗色模式内容 */}
</html>
```

## 项目结构

```
src/
├── components/
│   ├── HeroUIProvider.jsx    # NextUI Provider
│   ├── layout/
│   │   ├── NavBar.jsx
│   │   └── SettingsModal.jsx
│   ├── workspace/
│   │   ├── WorkspaceView.jsx
│   │   └── AllView.jsx
│   └── bookmark/
│       └── BookmarkCard.jsx
├── store/
│   └── useAppStore.js
├── hooks/
│   └── useBookmarks.js
├── styles/
│   └── index.css
├── App.jsx
└── main.jsx
```

## 注意事项

1. **事件处理**: NextUI使用`onPress`而不是`onClick`
2. **值变化**: 使用`onValueChange`而不是`onChange`
3. **选择组件**: `Select`组件使用`selectedKeys`（数组）
4. **图标**: 使用Lucide React图标库
5. **动画**: 已配置framer-motion支持

## 构建

```bash
npm run build
```

构建输出在`dist/`目录。
