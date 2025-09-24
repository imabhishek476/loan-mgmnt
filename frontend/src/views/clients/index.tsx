import { useAppSelector } from "../../hooks/user";
import Button from '@mui/material/Button';
import { Plus, User } from "lucide-react";
import { useState } from "react";
import AddClient from "../../views/clients/components/AddClient";

const Clients = () => {
  const { user } = useAppSelector(state => state.user);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen text-left flex bg-white transition-all duration-300 pl-[70px] lg:pl-0">
      <div className="w-full max-w-7xl flex flex-col mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Client Management</h1>
            <p className="text-gray-600 text-base">Manage client records and personal information</p>
          </div>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#145A32',
              '&:hover': { backgroundColor: '#0f3f23' },
            }}
            startIcon={<Plus />}
            onClick={() => setModalOpen(true)}
            className="self-start sm:self-auto"
          >
            New Client
          </Button>
        </div>
        {modalOpen && <AddClient open={modalOpen} onClose={() => setModalOpen(false)} />}
        <div className="flex flex-col grow bg-gray-100 rounded-lg shadow-inner p-5 sm:p-8 justify-center items-center text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-green-600 text-4xl">
            <User className="w-12 h-12" />
          </div>

          <div className="text-gray-700 text-lg font-medium">
            No clients found
          </div>
          <div className="text-gray-500 text-sm">
            Get started by adding your first client.
          </div>

          <Button
            variant="contained"
            sx={{
              backgroundColor: '#145A32',
              '&:hover': { backgroundColor: '#0f3f23' },
            }}
            startIcon={<Plus />}
            onClick={() => setModalOpen(true)}
            className="mt-2"
          >
            New Client
          </Button>
        </div>

      </div>
    </div>
  );
};
export default Clients;
