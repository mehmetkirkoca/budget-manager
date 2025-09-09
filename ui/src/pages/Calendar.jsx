import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Calendar from '../components/Calendar';

const CalendarPage = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t('calendar')} - ${t('appTitle')}`;
  }, [t]);

  return (
    <div>
      <Calendar />
    </div>
  );
};

export default CalendarPage;