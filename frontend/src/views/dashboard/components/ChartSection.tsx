import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from "recharts";

const ChartSection = ({ chartData }: any) => {
  const noData = !chartData || chartData.length === 0;
  const isSingle = chartData.length === 1;

  return (
    <div className="relative w-full h-[330px] sm:h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
          barCategoryGap={isSingle ? "45%" : "22%"}
          barGap={8}
        >
          {noData && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              fill="#6b7280"
              fontSize="16px"
              fontWeight="600"
            >
              No data available
            </text>
          )}
          {/* Soft Grid */}
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />

          {/* Clean X Axis */}
          <XAxis
            dataKey="name"
            padding={{ left: 10, right: 10 }}
            axisLine={false}
            tickLine={false}
            tick={({ x, y, payload }) => {
              const color = chartData.find(
                (d) => d.name === payload.value
              )?.companyColor;

              return (
                <text
                  x={x}
                  y={y + 14}
                  textAnchor="middle"
                  fill={color || "#374151"}
                  fontWeight="600"
                  style={{ fontSize: "13px" }}
                >
                  {payload.value}
                </text>
              );
            }}
          />

          {/* Clean Y Axis */}
          <YAxis
            width={60}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            axisLine={false}
            tickLine={false}
            style={{ fontSize: "12px", fill: "#6b7280" }}
          />

          {/* Minimal Tooltip */}
          <Tooltip
            cursor={false} 
            content={({ payload, label }) => {
              if (!payload?.length) return null;
              const entry = chartData.find((d) => d.name === label);

              return (
                <div className="bg-white px-4 py-2 rounded-lg shadow border border-gray-200">
                  <p
                    className="font-semibold text-sm mb-1"
                    style={{ color: entry?.companyColor }}
                  >
                    {label}
                  </p>
                  {payload.map((p, i) => (
                    <p key={i} className="text-sm text-gray-700">
                      {p.dataKey === "totalLoan"
                        ? "Principal Amount"
                        : "Paid Off"}
                      : <strong>${p.value.toLocaleString()}</strong>
                    </p>
                  ))}
                </div>
              );
            }}
          />

          {/* Nice Gradients */}
          <defs>
            <linearGradient id="gradPrinciple" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#166534" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#166534" stopOpacity="0.6" />
            </linearGradient>

            <linearGradient id="gradRecover" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#04af12" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#04af12" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Principle Amount */}
          <Bar
            dataKey="totalLoan"
            barSize={isSingle ? 50 : 38}
            radius={[10, 10, 0, 0]}
            fill="url(#gradPrinciple)"
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.companyColor} />
            ))}
            <LabelList
              dataKey="totalLoan"
              position="top"
              offset={8}
              content={({ x, y, width, value, index }) => {
                const entry = chartData[index];
                return (
                  <text
                    x={x + width / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fill={entry.companyColor}
                    fontWeight="600"
                    style={{ fontSize: "12px" }}
                  >
                    ${value.toLocaleString()}
                  </text>
                );
              }}
            />
          </Bar>

          {/* Recovered Amount */}
          <Bar
            dataKey="recovered"
            barSize={isSingle ? 50 : 38}
            radius={[10, 10, 0, 0]}
            fill="url(#gradRecover)"
          >
            <LabelList
              dataKey="recovered"
              position="top"
              offset={8}
              content={({ x, y, width, value }) => (
                <text
                  x={x + width / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fill="#04af12"
                  fontWeight="600"
                  style={{ fontSize: "12px" }}
                >
                  ${value.toLocaleString()}
                </text>
              )}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartSection;
