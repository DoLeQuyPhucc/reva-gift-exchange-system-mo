import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert } from 'react-native';

interface DateTimePickerCustomProps {
  date: Date;
  setDate: (date: Date) => void;
  allowedDays: string;
  onClose: () => void;
}

export const convertDayOfWeek = (allowedDays: string): string => {
    const dayMap: { [key: string]: string } = {
      'sun': 'Chủ Nhật',
      'mon': 'Thứ Hai', 
      'tue': 'Thứ Ba',
      'wed': 'Thứ Tư',
      'thu': 'Thứ Năm',
      'fri': 'Thứ Sáu',
      'sat': 'Thứ Bảy'
    };

    if(allowedDays === 'mon_tue_wed_thu_fri_sat_sun') {
        return 'Tất cả các ngày trong tuần';
    }

    if(allowedDays === 'mon_tue_wed_thu_fri') {
        return 'từ Thứ Hai đến Thứ Sáu';
    }

    if(allowedDays === 'sat_sun') {
        return 'Cuối tuần';
    }
  
    return allowedDays
      .split('_')
      .map(day => dayMap[day.toLowerCase()])
      .filter(day => day) // Remove any undefined values
      .join(', ');
  };

const DateTimePickerCustom: React.FC<DateTimePickerCustomProps> = ({ date, setDate, allowedDays, onClose }) => {

  // Map of day names to their corresponding day index
  const dayMap: { [key: string]: number } = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
  };

  // Convert input string to allowed day indices
  const allowedDayIndices = allowedDays.split('_')
    .map(day => dayMap[day.toLowerCase()])
    .filter(index => index !== undefined);

  const getNextAllowedDate = (currentDate: Date) => {
    let nextDate = new Date(currentDate);
    while (!allowedDayIndices.includes(nextDate.getDay())) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    return nextDate;
  };

  const initialAllowedDate = getNextAllowedDate(new Date());

  return (
    <DateTimePicker
      mode="date"
      value={date}
      minimumDate={initialAllowedDate}
      maximumDate={getNextAllowedDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))}
      onChange={(event, selectedDate) => {
        if (selectedDate) {
          const dayOfWeek = selectedDate.getDay();
          if (allowedDayIndices.includes(dayOfWeek)) {  
            setDate(selectedDate);
            onClose();
          } else {
            onClose();
            Alert.alert('Lỗi', `Chỉ được chọn các ngày: ${convertDayOfWeek(allowedDays)}`);
          }
        }
      }}
    />
  );
};

export default DateTimePickerCustom;