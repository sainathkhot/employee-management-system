import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { OrgTreeNode } from '../types';

export default function OrgTreeNodeView({ node, depth = 0 }: { node: OrgTreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-slate-200 pl-4 dark:border-slate-800' : ''}>
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
        {hasChildren ? (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-6 flex-shrink-0" />
        )}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
          {node.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            to={`/employees/${node._id}`}
            className="truncate text-sm font-medium text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-500"
          >
            {node.name}
          </Link>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {node.designation} · {node.department}
          </p>
        </div>
        {hasChildren && (
          <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {node.children.length} report{node.children.length !== 1 ? 's' : ''}
          </span>
        )}
        <span
          className={`h-2 w-2 flex-shrink-0 rounded-full ${
            node.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-400'
          }`}
          title={node.status}
        />
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <OrgTreeNodeView key={child._id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
