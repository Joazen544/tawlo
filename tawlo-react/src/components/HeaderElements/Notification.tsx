interface Props {
  notificationNumber: number;
}
const Notification = ({ notificationNumber }: Props) => {
  return (
    <a
      href="#"
      className="w-8 h-8 bg-bell-image bg-contain bg-no-repeat"
      style={{ backgroundSize: '1.5rem' }}
    >
      <div className="ml-4 mt-3 rounded-full bg-red-100 text-center">
        {notificationNumber}
      </div>
    </a>
  );
};

export default Notification;
