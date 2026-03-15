export default function Loading() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12 animate-pulse">
            {/* Header / Hero Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 aspect-[16/9] lg:aspect-[2/1] bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-xl h-40"></div>
                    <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-xl h-40"></div>
                </div>
            </div>

            {/* Content Feed Skeleton */}
            <div className="flex flex-col lg:flex-row gap-10">
                <div className="lg:w-2/3 space-y-6">
                    <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4 mb-8"></div>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col md:flex-row gap-5 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="w-full md:w-48 h-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                            <div className="flex-1 space-y-3 pt-2">
                                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div>
                                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Sidebar Skeleton */}
                <div className="lg:w-1/3 space-y-8">
                    <div className="bg-zinc-200 dark:bg-zinc-800 rounded-xl h-64"></div>
                    <div className="bg-zinc-200 dark:bg-zinc-800 rounded-xl h-64"></div>
                </div>
            </div>
        </div>
    );
}
