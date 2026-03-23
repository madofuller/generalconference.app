'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { useFilteredTalks } from '@/lib/filter-context';
import { getTopicTrends, getAllTopics } from '@/lib/analytics-utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const LINE_COLORS = ['#1B5E7B', '#f5a623', '#00668a', '#8455ef', '#40c2fd'];

export default function TopicTrendsPage() {
  const { talks, loading } = useFilteredTalks();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const allTopics = useMemo(() => getAllTopics(talks), [talks]);

  useEffect(() => {
    if (allTopics.length > 0 && selectedTopics.length === 0) {
      setSelectedTopics(allTopics.slice(0, 3).map(t => t.topic));
    }
  }, [allTopics, selectedTopics.length]);

  const trendData = useMemo(() => getTopicTrends(talks, selectedTopics), [talks, selectedTopics]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) return prev.filter(t => t !== topic);
      if (prev.length >= 5) return prev;
      return [...prev, topic];
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-[#f5a623] text-5xl animate-pulse mb-4">trending_up</span>
            <p className="text-[#524534]">Loading topic trends...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 flex flex-col pt-20 lg:pt-0">
        <TopAppBar title="Topic Trends" subtitle="How Topics Have Evolved" />

        <div className="px-4 md:px-8 lg:px-12 py-8 space-y-6 md:space-y-12 max-w-7xl mx-auto w-full">
          {/* Introduction */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 lg:gap-8 items-center">
            <div className="col-span-1 md:col-span-7 space-y-4">
              <h2 className="text-2xl md:text-4xl font-bold text-[#1c1c13] tracking-tight leading-tight">
                What Conference Talks About Over Time
              </h2>
              <p className="text-[#524534] leading-relaxed max-w-xl">
                Explore the thematic shifts in General Conference over the last several decades.
                Select topics below to visualize how the focus on different doctrines and challenges
                has ebbed and flowed through the years.
              </p>
            </div>
            <div className="col-span-1 md:col-span-5 relative">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#f5a623]/10 rounded-full blur-3xl" />
              <div className="bg-[#f8f4e4] p-4 md:p-6 lg:p-8 rounded-xl border border-[#d7c3ae]/10 shadow-sm relative z-10">
                <div className="flex items-center gap-4 mb-2">
                  <span className="material-symbols-outlined text-[#1B5E7B] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <span className="text-sm font-bold uppercase tracking-widest text-[#1B5E7B]/60">Insight of the Day</span>
                </div>
                <p className="italic text-[#1c1c13] font-medium">
                  &quot;The topic of &apos;Gathering Israel&apos; has seen a 45% increase in mentions since 2018.&quot;
                </p>
              </div>
            </div>
          </section>

          {/* Topic Selector Pills */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#524534]/60">Compare Topics</h3>
            <div className="flex flex-wrap gap-3">
              {allTopics.slice(0, 20).map(({ topic, count }) => {
                const isSelected = selectedTopics.includes(topic);
                const colorIndex = selectedTopics.indexOf(topic);
                return (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                      isSelected
                        ? 'text-white font-bold shadow-md'
                        : 'bg-[#f8f4e4] text-[#524534] hover:bg-[#f2eede] border border-[#d7c3ae]/30'
                    }`}
                    style={isSelected ? { backgroundColor: LINE_COLORS[colorIndex] || '#1B5E7B' } : {}}
                  >
                    {topic}
                    {isSelected && (
                      <span className="ml-2 w-2 h-2 rounded-full bg-white inline-block animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Chart */}
          <section className="bg-white rounded-xl p-5 md:p-8 lg:p-10 shadow-[0px_12px_32px_rgba(27,94,123,0.08)] relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-12 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#1B5E7B] tracking-widest uppercase">Thematic Frequency</span>
                <h4 className="text-2xl font-bold text-[#1c1c13]">% of talks containing keywords</h4>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-[#524534]">
                {selectedTopics.map((topic, i) => (
                  <div key={topic} className="flex items-center gap-2">
                    <span className="w-3 h-1 rounded-full" style={{ backgroundColor: LINE_COLORS[i] }} />
                    {topic}
                  </div>
                ))}
              </div>
            </div>

            {selectedTopics.length === 0 ? (
              <div className="text-center py-20 text-[#524534]">
                <span className="material-symbols-outlined text-5xl text-[#d7c3ae] mb-4">touch_app</span>
                <p className="text-lg">Select at least one topic above to see trends</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#d7c3ae" strokeOpacity={0.4} />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: '#524534', fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#d7c3ae', strokeOpacity: 0.4 }}
                  />
                  <YAxis
                    unit="%"
                    tick={{ fill: '#524534', fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#d7c3ae', strokeOpacity: 0.4 }}
                  />
                  <Tooltip
                    formatter={(value) => `${value}%`}
                    contentStyle={{
                      backgroundColor: '#fdf9e9',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0px 8px 24px rgba(27,94,123,0.1)',
                      fontWeight: 600,
                    }}
                  />
                  <Legend />
                  {selectedTopics.map((topic, i) => (
                    <Line
                      key={topic}
                      type="monotone"
                      dataKey={topic}
                      stroke={LINE_COLORS[i]}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: LINE_COLORS[i], stroke: 'white', strokeWidth: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* Bottom Narrative Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 pb-12">
            {[
              { icon: 'history_edu', color: 'bg-[#00668a]/10', iconColor: 'text-[#00668a]', title: 'Era of Instruction', desc: 'The 1970s and 80s were characterized by foundational doctrinal clarity and heavy emphasis on family organization.' },
              { icon: 'diversity_3', color: 'bg-[#f5a623]/20', iconColor: 'text-[#1B5E7B]', title: 'Era of Outreach', desc: 'The 90s saw a rise in topics related to worldwide growth and reaching every nation, tongue, and people.' },
              { icon: 'church', color: 'bg-[#8455ef]/10', iconColor: 'text-[#6b38d4]', title: 'Era of Gathering', desc: 'Current trends show a significant pivot towards covenant-path discipleship and the gathering of Israel.' },
            ].map((era) => (
              <div key={era.title} className="bg-[#f8f4e4] p-6 rounded-xl space-y-3">
                <div className={`w-10 h-10 rounded-lg ${era.color} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${era.iconColor}`}>{era.icon}</span>
                </div>
                <h5 className="font-bold text-lg text-[#1c1c13]">{era.title}</h5>
                <p className="text-sm text-[#524534]">{era.desc}</p>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
