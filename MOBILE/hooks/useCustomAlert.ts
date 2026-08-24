import { useCallback, useState } from 'react';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertConfig {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
}

export type ShowAlert = (
  title: string,
  message: string,
  buttons?: AlertButton[]
) => void;

const HIDDEN_ALERT: AlertConfig = {
  visible: false,
  title: '',
  message: '',
  buttons: [],
};

/**
 * Shared state for the CustomAlert dialog. Every screen used to declare this
 * config object and its show and hide helpers by hand. A consumer spreads
 * alertProps onto the dialog component and calls showAlert.
 */
export function useCustomAlert() {
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(HIDDEN_ALERT);

  const hideAlert = useCallback(() => setAlertConfig(HIDDEN_ALERT), []);

  const showAlert = useCallback<ShowAlert>((title, message, buttons) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons ?? [{ text: 'OK', style: 'cancel' }],
    });
  }, []);

  return { alertConfig, showAlert, hideAlert };
}
