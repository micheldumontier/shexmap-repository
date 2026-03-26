import { useAuthStore } from '../store/authStore.js';
import { useShExMaps } from '../api/shexmaps.js';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const authEnabled = import.meta.env.VITE_AUTH_ENABLED === 'true';

  const { data: myMaps } = useShExMaps(
    isAuthenticated && user ? { author: user.sub, limit: 50 } : {}
  );

  if (authEnabled && !isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Please sign in to view your dashboard.</p>
        <a href="/api/v1/auth/login?provider=github" className="bg-indigo-600 text-white px-4 py-2 rounded-md">
          Sign in with GitHub
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user ? `${user.name}'s Dashboard` : 'Dashboard'}
        </h1>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          My Contributions ({myMaps?.total ?? 0})
        </h2>
        {myMaps?.items.length === 0 && (
          <p className="text-gray-500 text-sm">No ShExMaps submitted yet.</p>
        )}
        <div className="space-y-2">
          {myMaps?.items.map((map) => (
            <a
              key={map.id}
              href={`/maps/${map.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-3 hover:border-indigo-300"
            >
              <div className="font-medium text-gray-900">{map.title}</div>
              <div className="text-sm text-gray-500">
                v{map.version} · {new Date(map.modifiedAt).toLocaleDateString()}
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
