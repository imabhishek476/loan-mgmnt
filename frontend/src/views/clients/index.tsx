// Clients.tsx
import { useAppSelector } from "../../hooks/user";

const Clients = () => {
  const { user } = useAppSelector((state) => state.user);

  return (
    <>
      <h1 className="text-2xl mb-4">Welcome {user?.name} to Clients</h1>
      <p>Your role: {user?.role}</p>
    </>
  );
};

export default Clients;
