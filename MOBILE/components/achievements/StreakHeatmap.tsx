import { colors } from '@/constants/colors';
import { MyActivity } from '@/types';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const CELL = 11;
const GAP = 2;

interface WeekColumn {
  /** null cells pad the week before the range start and after its end */
  cells: ({ date: string; active: boolean; future: boolean } | null)[];
}

const MONTHS_PER_SEGMENT = 4;

const SEGMENTS: { label: string; startMonth: number; endMonth: number }[] = [
  { label: 'Jan-Apr', startMonth: 0, endMonth: 3 },
  { label: 'May-Aug', startMonth: 4, endMonth: 7 },
  { label: 'Sep-Dec', startMonth: 8, endMonth: 11 },
];

/**
 * GitHub style contribution grid, four months at a time so it never becomes a
 * long horizontal scroll on a phone. One column per week starting Sunday,
 * active days filled. Intensity is binary because the backend records
 * presence per day, not counts. Future days render lighter so each segment
 * still forms a full rectangle.
 */
export const StreakHeatmap = ({ activity }: { activity: MyActivity }) => {
  // Open on the segment containing today.
  const [segment, setSegment] = useState(() =>
    Math.floor(new Date().getUTCMonth() / MONTHS_PER_SEGMENT)
  );

  const activeSet = useMemo(
    () => new Set(activity.activeDays),
    [activity.activeDays]
  );

  const weeks = useMemo<WeekColumn[]>(() => {
    const { startMonth, endMonth } = SEGMENTS[segment];
    const start = new Date(Date.UTC(activity.year, startMonth, 1));
    const end = new Date(Date.UTC(activity.year, endMonth + 1, 1));
    // Back up to the first Sunday so every column has seven cells
    const cursor = new Date(start);
    cursor.setUTCDate(cursor.getUTCDate() - cursor.getUTCDay());

    const columns: WeekColumn[] = [];
    let column: WeekColumn = { cells: [] };

    while (cursor < end || column.cells.length > 0) {
      const inRange = cursor >= start && cursor < end;
      if (inRange) {
        const key = cursor.toISOString().slice(0, 10);
        column.cells.push({
          date: key,
          active: activeSet.has(key),
          future: cursor.getTime() > Date.now(),
        });
      } else {
        column.cells.push(null);
      }

      if (column.cells.length === 7) {
        columns.push(column);
        column = { cells: [] };
        if (cursor >= end) break;
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return columns;
  }, [activity.year, activity.activeDays.length, segment, activeSet]);

  return (
    <View className="rounded-2xl border border-zinc-200 bg-white p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-product text-sm text-zinc-800">Activity</Text>
        <Text className="font-sans text-xs text-zinc-400">
          {activity.totalActive} active days in {activity.year}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row" style={{ gap: GAP }}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={{ gap: GAP }}>
              {week.cells.map((cell, dayIndex) => (
                <View
                  key={dayIndex}
                  style={{
                    width: CELL,
                    height: CELL,
                    borderRadius: 3,
                    backgroundColor: !cell
                      ? 'transparent'
                      : cell.future
                        ? colors.zinc[100]
                        : cell.active
                          ? colors.green[500]
                          : colors.zinc[200],
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="mt-3 flex-row items-center justify-between">
        {/* Segment selector, bottom left of the card */}
        <View className="flex-row gap-1.5">
          {SEGMENTS.map((option, index) => (
            <TouchableOpacity
              key={option.label}
              onPress={() => setSegment(index)}
              className={`rounded-full px-2.5 py-1 ${
                segment === index ? 'bg-zinc-900' : 'bg-zinc-100'
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`font-sans text-[10px] ${
                  segment === index ? 'text-white' : 'text-zinc-500'
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row items-center gap-1.5">
          <Text className="font-sans text-[10px] text-zinc-400">Less</Text>
          <View
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 3,
              backgroundColor: colors.zinc[200],
            }}
          />
          <View
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 3,
              backgroundColor: colors.green[500],
            }}
          />
          <Text className="font-sans text-[10px] text-zinc-400">More</Text>
        </View>
      </View>
    </View>
  );
};
