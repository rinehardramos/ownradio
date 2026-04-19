import type { DJ } from "@ownradio/shared";

interface TopDJsProps {
  djs: DJ[];
}

const AVATAR_GRADIENTS = [
  "from-pink-500 to-rose-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-teal-600",
  "from-amber-400 to-orange-500",
];

export function TopDJs({ djs }: TopDJsProps) {
  return (
    <section className="w-full py-8">
      <h2 className="text-lg font-bold text-white mb-4">Top DJs</h2>
      <div className="flex gap-6 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {djs.map((dj, index) => (
          <div
            key={dj.id}
            className="flex-none flex flex-col items-center gap-2 cursor-pointer"
          >
            {/* Avatar bubble */}
            <div className="relative">
              {dj.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dj.avatarUrl}
                  alt={dj.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`h-14 w-14 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {dj.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online indicator */}
              <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-brand-dark" />
            </div>
            {/* DJ name */}
            <p className="text-xs text-white/80 text-center max-w-[64px] truncate">
              {dj.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
