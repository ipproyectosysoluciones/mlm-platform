# Phase 3: Visual Tree UI — Technical Design

## Change Name

**Visual Tree UI**

---

## 1. Architecture Overview / Visión General de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  TreeView.tsx                        │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │ SearchBar   │  │ ReactFlow    │  │ Details   │  │    │
│  │  │             │  │ + Minimap    │  │ Panel     │  │    │
│  │  └─────────────┘  └──────────────┘  └──────────┘  │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │         TreeNodeComponent (Custom Node)       │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              TreeService.ts                          │    │
│  │  + Optimized pagination by depth                    │    │
│  │  + Batch queries to avoid N+1                        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer         | Technology    | Version               |
| ------------- | ------------- | --------------------- |
| Visualization | React Flow    | @xyflow/react ^12.0.0 |
| State         | Zustand       | ^5.0.0                |
| API Client    | Axios         | ^1.6.0                |
| i18n          | react-i18next | ^14.0.0               |
| Styling       | Tailwind CSS  | ^4.0.0                |
| Testing       | Playwright    | ^1.40.0               |

---

## 3. File Structure / Estructura de Archivos

```
frontend/src/
├── components/
│   └── tree/
│       ├── TreeView.tsx          # Main page component
│       ├── TreeNodeComponent.tsx # Custom React Flow node
│       ├── SearchBar.tsx         # User search component
│       ├── DetailsPanel.tsx     # Side panel for node details
│       └── TreeControls.tsx      # Zoom, fit, depth controls
├── pages/
│   └── TreeView.tsx             # Re-export for routing
├── stores/
│   └── treeStore.ts             # Zustand store for tree state
└── services/
    └── api.ts                   # Extended with new endpoints

backend/src/
├── services/
│   └── TreeService.ts           # Extended with pagination
├── controllers/
│   └── UserController.ts        # New endpoints
└── routes/
    └── user.routes.ts           # New routes
```

---

## 4. Backend Changes

### 4.1 TreeService.ts — New Methods

```typescript
/**
 * Obtiene subtree paginado por profundidad
 * Gets paginated subtree by depth
 */
async getSubtree(userId: string, depth: number, page: number, limit: number): Promise<{
  tree: TreeNode;
  pagination: { total: number; page: number; limit: number; hasMore: boolean };
}>;

/**
 * Busca usuarios en el subtree de un sponsor
 * Searches users in sponsor's subtree
 */
async searchInSubtree(sponsorId: string, query: string): Promise<User[]>;

/**
 * Obtiene detalles extendidos de un usuario
 * Gets extended details of a user
 */
async getUserDetails(userId: string): Promise<UserDetails | null>;
```

### 4.2 New Endpoints

```typescript
// routes/user.routes.ts

// GET /api/users/search?q=email|codec
router.get('/search', authMiddleware, userController.searchUsers);

// GET /api/users/:id/details
router.get('/:id/details', authMiddleware, userController.getUserDetails);

// GET /api/users/me/tree (existing, enhanced)
// GET /api/users/:id/tree (existing, enhanced)
```

### 4.3 Performance Optimization

**Problema actual:** N+1 queries en `getChildren()`

```typescript
// ANTES (N+1)
for (const child of children) {
  const leftCount = await User.count({ where: { sponsorId: child.id, position: 'left' } });
  const rightCount = await User.count({ where: { sponsorId: child.id, position: 'right' } });
}

// DESPUÉS (Batch)
const childIds = children.map((c) => c.id);
const counts = await User.findAll({
  attributes: ['sponsorId', 'position', [sequelize.fn('COUNT', '*'), 'count']],
  where: { sponsorId: childIds },
  group: ['sponsorId', 'position'],
});
```

---

## 5. Frontend Changes

### 5.1 TreeView.tsx — React Flow Integration

```tsx
import { ReactFlow, Background, Controls, MiniMap, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function TreeView() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Convert TreeNode to React Flow nodes/edges
  const convertToFlow = (tree: TreeNode, x = 0, y = 0, level = 0): void => {
    const nodeId = tree.id;
    setNodes((prev) => [
      ...prev,
      {
        id: nodeId,
        position: { x, y },
        data: { label: <TreeNodeComponent node={tree} /> },
        type: 'custom',
      },
    ]);

    tree.children.forEach((child, index) => {
      const childX = x + (index === 0 ? -150 : 150);
      const childY = y + 100;
      convertToFlow(child, childX, childY, level + 1);
      setEdges((prev) => [
        ...prev,
        {
          id: `${nodeId}-${child.id}`,
          source: nodeId,
          target: child.id,
          type: 'smoothstep',
        },
      ]);
    });
  };

  return (
    <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.25} maxZoom={2}>
      <Background />
      <Controls />
      <MiniMap
        nodeColor={(node) => (node.data?.position === 'left' ? '#3b82f6' : '#a855f7')}
        maskColor="rgba(0,0,0,0.1)"
      />
    </ReactFlow>
  );
}
```

### 5.2 Custom TreeNode Component

```tsx
function TreeNodeComponent({ data }: { data: TreeNode }) {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 min-w-[150px]',
        data.position === 'left' ? 'border-blue-500 bg-blue-50' : 'border-purple-500 bg-purple-50'
      )}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          {data.email[0].toUpperCase()}
        </div>
        <span className="font-semibold text-sm truncate">{data.email.split('@')[0]}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Level {data.level} • {data.position}
      </div>
      <div className="flex gap-1 mt-2">
        <span className="text-xs bg-blue-200 px-2 rounded">L: {data.stats.leftCount}</span>
        <span className="text-xs bg-purple-200 px-2 rounded">R: {data.stats.rightCount}</span>
      </div>
    </div>
  );
}
```

### 5.3 SearchBar Component

```tsx
function SearchBar({ onSelect }: { onSelect: (userId: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const data = await userService.search(query);
      setResults(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search user..."
        className="w-full px-4 py-2 border rounded-lg"
      />
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onSelect(user.id);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              {user.email}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5.4 DetailsPanel Component

```tsx
function DetailsPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [details, setDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    userService.getDetails(userId).then(setDetails);
  }, [userId]);

  if (!details) return <div>Loading...</div>;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg p-6">
      <button onClick={onClose} className="absolute top-4 right-4">
        ✕
      </button>
      <h2 className="text-lg font-bold mb-4">User Details</h2>
      <div className="space-y-3">
        <p>
          <strong>Email:</strong> {details.email}
        </p>
        <p>
          <strong>Level:</strong> {details.level}
        </p>
        <p>
          <strong>Position:</strong> {details.position}
        </p>
        <p>
          <strong>Status:</strong> {details.status}
        </p>
        <p>
          <strong>Joined:</strong> {new Date(details.createdAt).toLocaleDateString()}
        </p>
        <div className="border-t pt-3 mt-3">
          <p>
            <strong>Left Leg:</strong> {details.stats.leftCount}
          </p>
          <p>
            <strong>Right Leg:</strong> {details.stats.rightCount}
          </p>
          <p>
            <strong>Total Downline:</strong> {details.stats.totalDownline}
          </p>
        </div>
      </div>
      <button
        onClick={() => {
          /* expand from this node */
        }}
        className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg"
      >
        View Subtree
      </button>
    </div>
  );
}
```

---

## 6. Zustand Store

```typescript
// stores/treeStore.ts
import { create } from 'zustand';

interface TreeState {
  tree: TreeNode | null;
  selectedNodeId: string | null;
  selectedNodeDetails: UserDetails | null;
  isDetailsPanelOpen: boolean;
  searchQuery: string;
  searchResults: User[];

  // Actions
  setTree: (tree: TreeNode) => void;
  selectNode: (nodeId: string | null) => void;
  setNodeDetails: (details: UserDetails | null) => void;
  toggleDetailsPanel: (open: boolean) => void;
  setSearchResults: (results: User[]) => void;
  centerOnNode: (nodeId: string) => void;
}

export const useTreeStore = create<TreeState>((set, get) => ({
  tree: null,
  selectedNodeId: null,
  selectedNodeDetails: null,
  isDetailsPanelOpen: false,
  searchQuery: '',
  searchResults: [],

  setTree: (tree) => set({ tree }),
  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId, isDetailsPanelOpen: !!nodeId });
    if (nodeId) {
      // Fetch details
      userService.getDetails(nodeId).then((d) => set({ selectedNodeDetails: d }));
    }
  },
  setNodeDetails: (details) => set({ selectedNodeDetails: details }),
  toggleDetailsPanel: (open) => set({ isDetailsPanelOpen: open }),
  setSearchResults: (results) => set({ searchResults: results }),
  centerOnNode: (nodeId) => {
    // React Flow's fitView or setCenter
    // Implementation with useReactFlow hook
  },
}));
```

---

## 7. i18n Keys

```json
{
  "tree": {
    "title": "Binary Tree",
    "search": {
      "placeholder": "Search by email or code...",
      "noResults": "No users found",
      "searching": "Searching..."
    },
    "controls": {
      "zoomIn": "Zoom In",
      "zoomOut": "Zoom Out",
      "fitView": "Fit View",
      "depth": "Depth"
    },
    "details": {
      "title": "User Details",
      "email": "Email",
      "level": "Level",
      "position": "Position",
      "status": "Status",
      "joined": "Joined",
      "leftLeg": "Left Leg",
      "rightLeg": "Right Leg",
      "totalDownline": "Total Downline",
      "viewSubtree": "View Subtree",
      "close": "Close"
    },
    "empty": {
      "title": "No Members Yet",
      "description": "Your network will appear here once you have referrals."
    },
    "minimap": "Minimap"
  }
}
```

---

## 8. Testing Strategy

### 8.1 Integration Tests

```typescript
describe('Tree API', () => {
  it('GET /api/users/me/tree returns paginated tree', async () => {
    const res = await testAgent.get('/api/users/me/tree?depth=3&page=1&limit=50');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('tree');
    expect(res.body.data).toHaveProperty('pagination');
  });

  it('GET /api/users/search finds user by email', async () => {
    const res = await testAgent.get('/api/users/search?q=test');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
```

### 8.2 E2E Tests (Playwright)

```typescript
// e2e/tree.spec.ts
test('tree visualization renders with pan/zoom', async ({ page }) => {
  await page.goto('/tree');

  // Wait for tree to load
  await expect(page.locator('.react-flow')).toBeVisible();

  // Test zoom controls
  const zoomIn = page.locator('button[aria-label="zoom in"]');
  await zoomIn.click();

  // Test minimap
  await expect(page.locator('.react-flow__minimap')).toBeVisible();
});

test('search finds and centers on user', async ({ page }) => {
  await page.goto('/tree');

  // Search for user
  await page.fill('input[placeholder="Search by email or code..."]', 'test');
  await page.waitForSelector('[role="listbox"]');
  await page.click('[role="option"]:first-child');

  // Tree should center on node
  await expect(page.locator('.react-flow__node')).toBeVisible();
});
```

---

## 9. Performance Benchmarks

| Metric                   | Target  | Measurement          |
| ------------------------ | ------- | -------------------- |
| Initial load (100 nodes) | < 2s    | Lighthouse           |
| Pan/zoom FPS             | 60fps   | DevTools Performance |
| Search response          | < 500ms | Network tab          |
| Bundle size (React Flow) | < 100KB | Bundle analyzer      |

---

## 10. Risks & Mitigations

| Risk                        | Impact | Mitigation                                 |
| --------------------------- | ------ | ------------------------------------------ |
| React Flow breaking changes | Medium | Pin version, test upgrades                 |
| Large tree performance      | High   | Virtualization, depth pagination           |
| Complex migration           | Medium | Incremental: separate branch, feature flag |
| i18n completeness           | Low    | Systematic review, automated checks        |

---

## Status

**APPROVED** → Ready for Tasks

---

## Next

→ [tasks.md](./tasks.md)
