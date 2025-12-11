import { colors } from '@/constants/colors';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { forwardRef, ReactNode, useCallback, useMemo } from 'react';

export type Ref = BottomSheetModal;

interface CustomBottomSheetModalProps {
  children?: ReactNode;
}

const CustomBottomSheetModal = forwardRef<Ref, CustomBottomSheetModalProps>(
  ({ children }, ref) => {
    const snapPoints = useMemo(() => ['30%'], []);
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          {...props}
        />
      ),
      []
    );
    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: colors.zinc[50],
          borderColor: colors.zinc[100],
          borderWidth: 2,
          borderCurve: 'continuous',
          borderRadius: 16,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.zinc[200],
          width: 40,
        }}
      >
        <BottomSheetView className="flex-1 p-2">{children}</BottomSheetView>
      </BottomSheetModal>
    );
  }
);

export default CustomBottomSheetModal;
