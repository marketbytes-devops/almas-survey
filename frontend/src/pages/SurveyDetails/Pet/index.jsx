import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { FaChevronDown, FaChevronUp, FaPlus, FaMinus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useParams, useNavigate } from "react-router";
import Input from "../../../components/Input";

const Pet = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("pet-details");
  const [pets, setPets] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { customerData } = location.state || {};

  const methods = useForm({
    defaultValues: {
      petName: "",
      petType: "",
      breed: "",
      age: 0,
      weight: 0,
      specialCare: "",
      transportRequirements: "",
      feedingInstructions: "",
      medication: "",
      vaccinationStatus: "",
      behaviorNotes: "",
    },
  });

  const { handleSubmit, reset, watch } = methods;

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const onAddPet = (data) => {
    const newPet = {
      ...data,
      id: Date.now(), // Temporary ID for UI
    };
    setPets([...pets, newPet]);
    reset();
    setSuccess("Pet added successfully!");
    setTimeout(() => setSuccess(null), 3000);
  };

  const removePet = (petId) => {
    setPets(pets.filter(pet => pet.id !== petId));
    setSuccess("Pet removed successfully!");
    setTimeout(() => setSuccess(null), 3000);
  };

  const onNext = () => {
    if (pets.length === 0) {
      setError("Please add at least one pet before proceeding.");
      return;
    }
    
    navigate(`/survey/${surveyId}/service`, {
      state: {
        customerData,
        pets,
      },
    });
  };

  const onBack = () => {
    navigate(`/survey/${surveyId}/customer`, {
      state: { customerData },
    });
  };

  const petTypeOptions = [
    { value: "dog", label: "Dog" },
    { value: "cat", label: "Cat" },
    { value: "bird", label: "Bird" },
    { value: "fish", label: "Fish" },
    { value: "reptile", label: "Reptile" },
    { value: "small_mammal", label: "Small Mammal" },
    { value: "other", label: "Other" },
  ];

  const breedOptions = {
    dog: [
      { value: "labrador", label: "Labrador Retriever" },
      { value: "german_shepherd", label: "German Shepherd" },
      { value: "golden_retriever", label: "Golden Retriever" },
      { value: "bulldog", label: "Bulldog" },
      { value: "beagle", label: "Beagle" },
      { value: "poodle", label: "Poodle" },
      { value: "other", label: "Other" },
    ],
    cat: [
      { value: "siamese", label: "Siamese" },
      { value: "persian", label: "Persian" },
      { value: "maine_coon", label: "Maine Coon" },
      { value: "ragdoll", label: "Ragdoll" },
      { value: "bengal", label: "Bengal" },
      { value: "other", label: "Other" },
    ],
    bird: [
      { value: "parrot", label: "Parrot" },
      { value: "canary", label: "Canary" },
      { value: "finch", label: "Finch" },
      { value: "cockatiel", label: "Cockatiel" },
      { value: "other", label: "Other" },
    ],
    other: [
      { value: "other", label: "Other" },
    ]
  };

  const vaccinationOptions = [
    { value: "up_to_date", label: "Up to Date" },
    { value: "not_up_to_date", label: "Not Up to Date" },
    { value: "unknown", label: "Unknown" },
  ];

  const getBreedOptions = (petType) => {
    return breedOptions[petType] || breedOptions.other;
  };

  const sections = [
    {
      id: "pet-details",
      title: "Pet Details",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <Input
            label="Pet Name"
            name="petName"
            type="text"
            rules={{ required: "Pet Name is required" }}
            placeholder="Enter pet name"
          />
          <Input
            label="Pet Type"
            name="petType"
            type="select"
            options={[{ value: "", label: "Select Pet Type" }, ...petTypeOptions]}
            rules={{ required: "Pet Type is required" }}
          />
          <Input
            label="Breed"
            name="breed"
            type="select"
            options={[{ value: "", label: "Select Breed" }, ...getBreedOptions(watch("petType"))]}
            rules={{ required: "Breed is required" }}
          />
          <Input
            label="Age (years)"
            name="age"
            type="number"
            rules={{ 
              required: "Age is required", 
              min: { value: 0, message: "Age cannot be negative" },
              max: { value: 50, message: "Please enter a valid age" }
            }}
            placeholder="Age in years"
          />
          <Input
            label="Weight (kg)"
            name="weight"
            type="number"
            rules={{ 
              required: "Weight is required", 
              min: { value: 0, message: "Weight cannot be negative" },
              max: { value: 200, message: "Please enter a valid weight" }
            }}
            placeholder="Weight in kilograms"
          />
          <Input
            label="Vaccination Status"
            name="vaccinationStatus"
            type="select"
            options={[{ value: "", label: "Select Status" }, ...vaccinationOptions]}
            rules={{ required: "Vaccination status is required" }}
          />
          <div className="md:col-span-2">
            <Input
              label="Special Care Instructions"
              name="specialCare"
              type="textarea"
              placeholder="Any special care requirements, health issues, or specific needs"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Transport Requirements"
              name="transportRequirements"
              type="textarea"
              placeholder="Specific requirements for transport (cage size, temperature, etc.)"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Feeding Instructions"
              name="feedingInstructions"
              type="textarea"
              placeholder="Feeding schedule, diet restrictions, special food requirements"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Medication"
              name="medication"
              type="textarea"
              placeholder="Current medications, dosage, and administration instructions"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Behavior Notes"
              name="behaviorNotes"
              type="textarea"
              placeholder="Temperament, behavior with other animals/people, any special handling requirements"
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleSubmit(onAddPet)}
              className="px-6 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:bg-[#6b8ca3] transition-colors duration-300"
            >
              Add Pet
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
            >
              Clear Form
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "pet-list",
      title: "Added Pets",
      content: (
        <div className="p-4">
          {pets.length > 0 ? (
            <div className="space-y-4">
              {pets.map((pet, index) => (
                <motion.div
                  key={pet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {pet.petName} 
                        <span className="ml-2 text-sm font-normal text-gray-600 capitalize">
                          ({pet.petType})
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">{pet.breed}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePet(pet.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      aria-label={`Remove ${pet.petName}`}
                    >
                      <FaMinus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Age:</span>
                      <p className="text-gray-600">{pet.age} years</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Weight:</span>
                      <p className="text-gray-600">{pet.weight} kg</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Vaccination:</span>
                      <p className="text-gray-600 capitalize">{pet.vaccinationStatus?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">ID:</span>
                      <p className="text-gray-600">#{index + 1}</p>
                    </div>
                  </div>

                  {/* Additional details in expandable sections */}
                  <div className="mt-3 space-y-2">
                    {pet.specialCare && (
                      <div>
                        <span className="font-medium text-gray-700 text-sm">Special Care:</span>
                        <p className="text-gray-600 text-sm">{pet.specialCare}</p>
                      </div>
                    )}
                    {pet.transportRequirements && (
                      <div>
                        <span className="font-medium text-gray-700 text-sm">Transport:</span>
                        <p className="text-gray-600 text-sm">{pet.transportRequirements}</p>
                      </div>
                    )}
                    {pet.medication && (
                      <div>
                        <span className="font-medium text-gray-700 text-sm">Medication:</span>
                        <p className="text-gray-600 text-sm">{pet.medication}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No pets added yet</p>
              <p className="text-gray-400 text-sm mt-1">Add pets using the form above</p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg shadow"
          >
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg shadow"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <FormProvider {...methods}>
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="group rounded-lg shadow-sm w-full flex justify-between items-center p-4 text-left bg-gray-100 hover:bg-[#4c7085] transition-all duration-300"
              >
                <span className="text-md font-medium text-gray-800 group-hover:text-white">
                  {section.title}
                  {section.id === "pet-list" && pets.length > 0 && (
                    <span className="ml-2 bg-white text-[#4c7085] px-2 py-1 rounded-full text-xs">
                      {pets.length} {pets.length === 1 ? 'pet' : 'pets'}
                    </span>
                  )}
                </span>
                {activeSection === section.id ? (
                  <FaChevronUp className="w-3 h-3 text-gray-600 group-hover:text-white" />
                ) : (
                  <FaChevronDown className="w-3 h-3 text-gray-600 group-hover:text-white" />
                )}
              </button>
              <AnimatePresence>
                {activeSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    {section.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          
          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 w-full sm:w-auto bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 hover:shadow-md transition-all duration-300 text-sm"
            >
              Back to Customer
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={pets.length === 0}
              className="px-6 py-3 w-full sm:w-auto bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:bg-[#6b8ca3] hover:shadow-md transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Service ({pets.length} {pets.length === 1 ? 'Pet' : 'Pets'})
            </button>
          </div>
        </div>
      </FormProvider>
    </div>
  );
};

export default Pet;