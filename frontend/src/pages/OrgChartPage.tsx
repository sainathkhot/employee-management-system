import { useEffect, useState } from 'react';
import { organizationApi } from '../services/endpoints';
import type { OrgTreeNode } from '../types';
import OrgTreeNodeView from '../components/OrgTreeNode';

export default function OrgChartPage() {
  const [tree, setTree] = useState<OrgTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    organizationApi
      .tree()
      .then(setTree)
      .catch(() => setError('Failed to load organization chart.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Organization Chart</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Reporting hierarchy across the organization. Click a name to view their profile.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && tree.length === 0 && (
        <p className="text-sm text-slate-400">No organization data available yet.</p>
      )}

      <div className="space-y-3">
        {tree.map((root) => (
          <OrgTreeNodeView key={root._id} node={root} />
        ))}
      </div>
    </div>
  );
}
