import { useLocation } from "react-router";
import { motion } from "framer-motion";
import { FaBox, FaWeight, FaRuler, FaTools, FaShippingFast, FaDollarSign, FaStickyNote, FaTag, FaLayerGroup } from "react-icons/fa";

const ViewArticle = () => {
  const location = useLocation();
  const articles = location.state?.articles || [];
  const vehicles = location.state?.vehicles || [];

  const getPackingOptionColor = (option) => {
    switch (option) {
      case 'full': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'none': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMoveStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMoveStatus = (status) => {
    return status ? status.replace('_', ' ').toUpperCase() : 'N/A';
  };

  const formatPackingOption = (option) => {
    return option ? option.charAt(0).toUpperCase() + option.slice(1) + ' Packing' : 'N/A';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Articles Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <FaBox className="w-6 h-6 text-[#4c7085]" />
          <h2 className="text-2xl font-bold text-gray-800">Articles & Items</h2>
          <span className="bg-[#4c7085] text-white px-3 py-1 rounded-full text-sm">
            {articles.length} {articles.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FaBox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No items added yet</p>
            <p className="text-gray-400 text-sm mt-1">Articles will appear here once added</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {articles.map((article, index) => (
              <motion.div
                key={index}
                className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="p-6">
                  {/* Header Section */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div className="flex items-center gap-3 mb-3 lg:mb-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] rounded-lg flex items-center justify-center">
                        <FaBox className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{article.itemName}</h3>
                        {article.category && (
                          <p className="text-sm text-gray-600 capitalize">{article.category}</p>
                        )}
                        {article.room && (
                          <p className="text-xs text-gray-500 mt-1">
                            Room: <span className="font-medium">{article.room}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {article.packingOption && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPackingOptionColor(article.packingOption)}`}>
                          {formatPackingOption(article.packingOption)}
                        </span>
                      )}
                      {article.moveStatus && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMoveStatusColor(article.moveStatus)}`}>
                          {formatMoveStatus(article.moveStatus)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                    {/* Quantity */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FaLayerGroup className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="text-xs font-medium text-gray-600">Quantity</p>
                        <p className="text-sm font-semibold text-gray-800">{article.quantity}</p>
                      </div>
                    </div>

                    {/* Volume */}
                    {article.volume && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <FaRuler className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs font-medium text-blue-600">Volume</p>
                          <p className="text-sm font-semibold text-blue-800">
                            {article.volume} {article.volumeUnit}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Weight */}
                    {article.weight && (
                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <FaWeight className="w-4 h-4 text-orange-600" />
                        <div>
                          <p className="text-xs font-medium text-orange-600">Weight</p>
                          <p className="text-sm font-semibold text-orange-800">
                            {article.weight} {article.weightUnit}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Handyman */}
                    {article.handyman && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <FaTools className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="text-xs font-medium text-purple-600">Handyman</p>
                          <p className="text-sm font-semibold text-purple-800 capitalize">
                            {article.handyman}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount and Currency */}
                    {(article.amount || article.currency) && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <FaDollarSign className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-xs font-medium text-green-600">Amount</p>
                          <p className="text-sm font-semibold text-green-800">
                            {article.amount ? `${article.amount} ${article.currency || ''}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Special Requirements */}
                    {(article.handyman || article.packingOption) && (
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                        <FaShippingFast className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="text-xs font-medium text-indigo-600">Services</p>
                          <p className="text-sm text-indigo-800">
                            {article.handyman && `Handyman: ${article.handyman}`}
                            {article.handyman && article.packingOption && ' • '}
                            {article.packingOption && `Packing: ${formatPackingOption(article.packingOption)}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remarks */}
                  {article.remarks && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FaStickyNote className="w-4 h-4 text-gray-600" />
                        <p className="text-xs font-medium text-gray-600">Remarks</p>
                      </div>
                      <p className="text-sm text-gray-800">{article.remarks}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Vehicles Section */}
      {vehicles.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <FaShippingFast className="w-6 h-6 text-[#4c7085]" />
            <h2 className="text-2xl font-bold text-gray-800">Vehicles</h2>
            <span className="bg-[#4c7085] text-white px-3 py-1 rounded-full text-sm">
              {vehicles.length} {vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
            </span>
          </div>

          <div className="grid gap-6">
            {vehicles.map((vehicle, index) => (
              <motion.div
                key={index}
                className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (articles.length + index) * 0.1 }}
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div className="flex items-center gap-3 mb-3 lg:mb-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] rounded-lg flex items-center justify-center">
                        <FaShippingFast className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {vehicle.make} {vehicle.model}
                        </h3>
                        {vehicle.vehicleType && (
                          <p className="text-sm text-gray-600 capitalize">{vehicle.vehicleType}</p>
                        )}
                      </div>
                    </div>
                    
                    {vehicle.insurance && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Insurance Included
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vehicle Details */}
                    <div className="space-y-3">
                      {vehicle.vehicleType && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Type</span>
                          <span className="text-sm text-gray-800 capitalize">{vehicle.vehicleType}</span>
                        </div>
                      )}
                      
                      {vehicle.make && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Make</span>
                          <span className="text-sm text-gray-800">{vehicle.make}</span>
                        </div>
                      )}
                      
                      {vehicle.model && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Model</span>
                          <span className="text-sm text-gray-800">{vehicle.model}</span>
                        </div>
                      )}
                    </div>

                    {/* Insurance and Transport */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Insurance</span>
                        <span className={`text-sm font-medium ${vehicle.insurance ? 'text-green-600' : 'text-red-600'}`}>
                          {vehicle.insurance ? 'Yes' : 'No'}
                        </span>
                      </div>
                      
                      {vehicle.transportMode && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Transport Mode</span>
                          <span className="text-sm text-gray-800 capitalize">{vehicle.transportMode}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remark */}
                  {vehicle.remark && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FaStickyNote className="w-4 h-4 text-gray-600" />
                        <p className="text-xs font-medium text-gray-600">Additional Notes</p>
                      </div>
                      <p className="text-sm text-gray-800">{vehicle.remark}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {(articles.length > 0 || vehicles.length > 0) && (
        <motion.div
          className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] rounded-xl p-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{articles.length}</div>
              <div className="text-sm opacity-90">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{vehicles.length}</div>
              <div className="text-sm opacity-90">Vehicles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {articles.reduce((total, article) => total + (parseInt(article.quantity) || 0), 0)}
              </div>
              <div className="text-sm opacity-90">Total Quantity</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ViewArticle;