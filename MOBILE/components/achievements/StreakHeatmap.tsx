import { colors } from '@/constants/colors';
import { MyActivity } from '@/types';
import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

const CELL = 11;
const GAP = 2;

interface WeekColumn {
  /** null cells pad the week before Jan 1 and after Dec 31 */
  cells: ({ date: string; active: boolean; future: boolean } | null)[];
}

/**
 * GitHub style yearly contribution grid: one column per week, seven cells
 * per column, active days filled. Intensity is binary because the backend
 * records presence per day, not counts. Future days in the current year
 * render lighter so the year still forms a full rectangle.
 */
export const StreakHeatmap = ({ activity }: { activity: MyActivity }) => {
  const activeSet = useMemo(
    () => new Set(activity.activeDays),
    [activity.activeDays]
  );

  const weeks = useMemo<WeekColumn[]>(() => {
    const start = new Date(Date.UTC(activity.year, 0, 1));
    const end = new Date(Date.UTC(activity.year + 1, 0, 1));
    // Back up to the first Sunday so every column has seven cells
    const cursor = new Date(start);
    cursor.setUTCDate(cursor.getUTCDate() - cursor.getUTCDay());

    const columns: WeekColumn[] = [];
    let column: WeekColumn = { cells: [] };

    while (cursor < end || column.cells.length > 0) {
      const inYear = cursor >= start && cursor < end;
      if (inYear) {
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
  }, [activity.year, activeSet]);

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

      <View className="mt-3 flex-row items-center justify-end gap-1.5">
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
  );
};
