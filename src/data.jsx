// data.js
let bookingData = null;

export const setBookingData = (data) => {
  bookingData = data;
};

export const getBookingData = () => {
  return bookingData;
};