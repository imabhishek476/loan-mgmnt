import { observer } from "mobx-react-lite";
import { clientStore } from "../../../store/ClientStore";
import { loanStore } from "../../../store/LoanStore";
import { useParams } from "react-router-dom";
import ClientViewModal from "./ClientViewModal";
import { useEffect } from "react";

const ClientDetailsPage = observer(() => {
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      clientStore.fetchClientById(id);
      loanStore.fetchActiveLoans(id);
    }
  }, [id]);

  const client = clientStore.selectedClient;

  if (!client) return <p>Loading...</p>;

  return (
    <div className="w-full text-left flex flex-col">
      <ClientViewModal
        open={true}
        onClose={() => window.history.back()}
        client={client}
        onEditClient={() => { }}
      />
    </div>
  );

});

export default ClientDetailsPage;
