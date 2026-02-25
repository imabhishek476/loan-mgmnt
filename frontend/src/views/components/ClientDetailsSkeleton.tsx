

import { Skeleton } from "@mui/material";
const ClientDetailsSkeleton = () => {
  return (
    <div className="w-full p-4">

      {/* Tabs */}
      <div className="flex gap-6 border-b pb-2 mb-4">
        <Skeleton variant="rectangular" width={120} height={36} />
        <Skeleton variant="rectangular" width={120} height={36} />
        <Skeleton variant="rectangular" width={100} height={36} />
        <Skeleton variant="rectangular" width={120} height={36} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* LEFT → Client Info */}
        <div>

          {/* Section Title */}
          <div className="flex items-center gap-2 mb-3">
            <Skeleton variant="text" width={180} height={28} />
            <Skeleton variant="circular" width={18} height={18} />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">

            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <Skeleton variant="text" width={90} height={18} />
                <Skeleton variant="text" width={120} height={20} />
              </div>
            ))}

          </div>

          {/* Memo */}
          <div className="mt-5">
            <Skeleton variant="text" width={80} height={20} />
            <Skeleton
              variant="rectangular"
              height={70}
              className="rounded-md"
            />
          </div>
        </div>

        {/* RIGHT → Loan Summary */}
        <div>

          <Skeleton variant="text" width={140} height={26} />

          <div className="mt-3 space-y-2">
            <Skeleton variant="text" width="60%" height={18} />
            <Skeleton variant="text" width="80%" height={18} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClientDetailsSkeleton;
