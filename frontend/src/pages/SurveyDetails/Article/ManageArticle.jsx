import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router";
import apiClient from "../../../api/apiClient";
import Button from "../../../components/Button";
import Input from "../../../components/Input";

const ManageArticle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { surveyId, customerData, articles = [], vehicles = [] } = location.state || {};

  const methods = useForm({
    defaultValues: {
      room: "",
      itemName: "",
      quantity: 1,
      volume: "",
      volumeUnit: "",
      weight: "",
      weightUnit: "",
      handyman: "",
      packingOption: "",
      moveStatus: "new",
      amount: "",
      currency: "",
      remarks: "",
    },
  });

  const { handleSubmit, watch, reset, setValue } = methods;
  const [rooms, setRooms] = useState([]);
  const [items, setItems] = useState([]);
  const [volumeUnitOptions, setVolumeUnitOptions] = useState([]);
  const [weightUnitOptions, setWeightUnitOptions] = useState([]);
  const [packingOptionOptions, setPackingOptionOptions] = useState([]);
  const [handymanOptions, setHandymanOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchTypes = async () => {
      setIsLoadingTypes(true);
      try {
        const [
          roomsResponse,
          volumeUnitsResponse,
          weightUnitsResponse,
          packingTypesResponse,
          handymanResponse,
          currencyResponse,
        ] = await Promise.all([
          apiClient.get("/rooms/"),
          apiClient.get("/volume-units/"),
          apiClient.get("/weight-units/"),
          apiClient.get("/packing-types/"),
          apiClient.get("/handyman/"),
          apiClient.get("/currencies/"),
        ]);

        setRooms(roomsResponse.data.map((room) => ({ value: room.id, label: room.name })));
        setVolumeUnitOptions(volumeUnitsResponse.data.map((unit) => ({ value: unit.name, label: unit.name })));
        setWeightUnitOptions(weightUnitsResponse.data.map((unit) => ({ value: unit.name, label: unit.name })));
        setPackingOptionOptions(
          packingTypesResponse.data.map((type) => ({ value: type.name.toLowerCase(), label: type.name }))
        );
        setHandymanOptions(handymanResponse.data.map((handyman) => ({ value: handyman.type_name, label: handyman.type_name })));
        setCurrencyOptions(currencyResponse.data.map((currency) => ({ value: currency.name, label: currency.name })));

        // Set default values
        setValue("volumeUnit", volumeUnitsResponse.data[0]?.name || "CFT");
        setValue("weightUnit", weightUnitsResponse.data[0]?.name || "KG");
        setValue("packingOption", packingTypesResponse.data[0]?.name.toLowerCase() || "none");
        setValue("handyman", handymanResponse.data[0]?.type_name || "no");
        setValue("currency", currencyResponse.data[0]?.name || "USD");
      } catch (err) {
        console.error("Failed to fetch types:", err);
        setError("Failed to fetch options. Using default values.");
        setVolumeUnitOptions([{ value: "CFT", label: "CFT Net" }]);
        setWeightUnitOptions([{ value: "KG", label: "KG Net" }]);
        setPackingOptionOptions([
          { value: "full", label: "Full Packing" },
          { value: "partial", label: "Partial Packing" },
          { value: "none", label: "No Packing" },
        ]);
        setHandymanOptions([
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]);
        setCurrencyOptions([
          { value: "USD", label: "USD" },
          { value: "INR", label: "INR" },
        ]);
        setTimeout(() => setError(null), 3000);
      } finally {
        setIsLoadingTypes(false);
      }
    };
    fetchTypes();
  }, [setValue]);

  useEffect(() => {
    const fetchItemsByRoom = async () => {
      const roomId = watch("room");
      if (roomId) {
        try {
          const response = await apiClient.get(`/articles/items-by-room/?room_id=${roomId}`);
          setItems(response.data.items);
        } catch (err) {
          console.error("Failed to fetch items for room:", err);
          setError("Failed to fetch items for selected room.");
          setItems([]);
          setTimeout(() => setError(null), 3000);
        }
      } else {
        setItems([]);
      }
    };
    fetchItemsByRoom();
  }, [watch("room")]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        survey: surveyId,
        room: data.room,
        item_name: data.itemName,
        quantity: parseInt(data.quantity),
        volume: data.volume ? parseFloat(data.volume) : null,
        volume_unit: data.volumeUnit,
        weight: data.weight ? parseFloat(data.weight) : null,
        weight_unit: data.weightUnit,
        handyman: data.handyman,
        packing_option: data.packingOption,
        move_status: data.moveStatus,
        amount: data.amount ? parseFloat(data.amount) : null,
        currency: data.currency,
        remarks: data.remarks || "",
      };
      await apiClient.post("/articles/", payload);
      setSuccess("Article added successfully!");
      setTimeout(() => {
        setSuccess(null);
        navigate(`/survey/${surveyId}/article`, {
          state: { customerData, articles: [...articles, payload], vehicles },
        });
      }, 2000);
      reset();
    } catch (err) {
      console.error("Failed to add article:", err);
      setError(err.response?.data?.item_name || "Failed to add article. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  if (isLoadingTypes) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md">
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <h2 className="text-lg font-semibold mb-6">Add New Article</h2>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Room"
              name="room"
              type="select"
              options={rooms}
              rules={{ required: "Room is required" }}
            />
            <Input
              label="Item Name"
              name="itemName"
              type="select"
              options={items}
              rules={{ required: "Item Name is required" }}
              disabled={!watch("room")}
            />
            <Input
              label="Quantity"
              name="quantity"
              type="number"
              rules={{ required: "Quantity is required", min: { value: 1, message: "Quantity must be at least 1" } }}
            />
            <Input
              label="Volume"
              name="volume"
              type="number"
              step="0.01"
            />
            <Input
              label="Volume Unit"
              name="volumeUnit"
              type="select"
              options={volumeUnitOptions}
            />
            <Input
              label="Weight"
              name="weight"
              type="number"
              step="0.01"
            />
            <Input
              label="Weight Unit"
              name="weightUnit"
              type="select"
              options={weightUnitOptions}
            />
            <Input
              label="Handyman"
              name="handyman"
              type="select"
              options={handymanOptions}
            />
            <Input
              label="Packing Option"
              name="packingOption"
              type="select"
              options={packingOptionOptions}
            />
            <Input
              label="Move Status"
              name="moveStatus"
              type="text"
            />
            <Input
              label="Amount"
              name="amount"
              type="number"
              step="0.01"
            />
            <Input
              label="Currency"
              name="currency"
              type="select"
              options={currencyOptions}
            />
          </div>
          <div className="grid grid-cols-1">
            <Input
              label="Remarks"
              name="remarks"
              type="textarea"
            />
          </div>
          <Button
            type="submit"
            disabled={!watch("room") || !watch("itemName") || !watch("quantity")}
            className="w-full md:w-auto"
          >
            Add Article
          </Button>
        </form>
      </FormProvider>
    </div>
  );
};

export default ManageArticle;