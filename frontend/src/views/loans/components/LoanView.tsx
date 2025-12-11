import { observer } from "mobx-react-lite";
import moment from "moment";
import { X } from "lucide-react";
import { clientStore } from "../../../store/ClientStore";
import { companyStore } from "../../../store/CompanyStore";

const LoanView = observer(
  ({ selectedLoan, handleClose, total, remaining, runningTenure }: any) => {
    return (
      <>
        {selectedLoan && (
          <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/70 overflow-auto">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl mx-3 sm:mx-6 relative flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex justify-between items-center border-b px-6 py-3">
                <h2 className="font-semibold text-xl text-green-700">
                  Loan Details
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-600 hover:text-red-500 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800 text-sm mt-2">
                  {/* Customer */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Customer
                    </p>
                    <p className="font-medium">
                      {selectedLoan.client?.fullName ||
                        clientStore.clients.find(
                          (c) => c._id === selectedLoan.client?._id
                        )?.fullName ||
                        "-"}
                    </p>
                  </div>

                  {/* Company */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Company
                    </p>
                    <p className="font-medium">
                      {selectedLoan.company?.companyName ||
                        companyStore.companies.find(
                          (c) => c._id === selectedLoan.company?._id
                        )?.companyName ||
                        "-"}
                    </p>
                  </div>

                  {/* Base Amount */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Base Amount
                    </p>
                    <p className="font-semibold text-green-700">
                      $
                      {Number(selectedLoan.subTotal || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>
                  </div>

                  {/* Total Loan */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Total Loan
                    </p>
                    <p className="font-semibold text-green-700">
                      $
                      {total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  {/* Paid Amount */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Paid Amount
                    </p>
                    <p className="font-semibold text-blue-700">
                      $
                      {Number(selectedLoan.paidAmount || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>
                  </div>

                  {/* Remaining Amount */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Remaining Amount
                    </p>
                    <p
                      className={`font-semibold ${
                        selectedLoan.status === "Merged"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      $
                      {(selectedLoan.status === "Merged"
                        ? 0
                        : remaining
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="sm:col-span-2 mt-2">
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Progress
                    </p>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          selectedLoan.status === "Merged"
                            ? "bg-green-500"
                            : "bg-green-600"
                        }`}
                        style={{
                          width: `${
                            selectedLoan.status === "Merged"
                              ? 100
                              : ((selectedLoan.paidAmount || 0) /
                                  (total || 1)) *
                                100
                          }%`,
                        }}
                      />
                    </div>

                    {selectedLoan.status === "Merged" && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Merged loan — fully settled
                      </p>
                    )}
                  </div>

                  {/* Interest Type */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Interest Type
                    </p>
                    <p className="font-medium capitalize">
                      {selectedLoan.interestType
                        ? selectedLoan.interestType.charAt(0).toUpperCase() +
                          selectedLoan.interestType.slice(1)
                        : "-"}
                    </p>
                  </div>

                  {/* Monthly Rate */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Monthly Rate
                    </p>
                    <p className="font-medium">{selectedLoan.monthlyRate}%</p>
                  </div>

                  {/* Loan Term */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Loan Term
                    </p>
                    <p className="font-medium">{runningTenure} Months</p>
                  </div>

                  {/* Issue Date */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Issue Date
                    </p>
                    <p className="font-medium">
                      {moment(selectedLoan.issueDate).format("MMM DD, YYYY")}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-2 border-t border-gray-200 pt-3 mt-2">
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Loan Status
                    </p>
                    <p
                      className={`font-semibold ${
                        selectedLoan.status === "Paid Off"
                          ? "text-gray-500"
                          : selectedLoan.status === "Merged"
                          ? "text-green-600"
                          : selectedLoan.status === "Active"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {selectedLoan.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end border-t px-6 py-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

export default LoanView;
