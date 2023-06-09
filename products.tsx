import "../../../styles/globals.css";
import { ChangeEvent, useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/router";
import fs from "fs";
import path from "path";
import { addProduct } from "../../../utils/product";


interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
}



const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Dental X-Ray Unit",
      description: "A used dental x-ray unit in good condition.",
      price: 2500,
    },
    {
      id: 2,
      name: "Dental Chair",
      description: "A used dental chair in good condition.",
      price: 1500,
    },
    {
      id: 3,
      name: "Dental Light",
      description: "A used dental light in good condition.",
      price: 500,
    },
  ]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    price: 0,
  });

  const [images, setImages] = useState<File[]>([]);
  const fileSelectedHandler = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      if (selectedFiles.length + images.length <= 10) {
        setImages((prevImages) => [...prevImages, ...selectedFiles]);
      } else {
        alert("You can only upload up to 10 images.");
      }
    }
  };

 const fileUploadHandler = async () => {
   const storagePath = path.join(process.cwd(), "/pages/admin/storage/Units");

   images.forEach((image) => {
     const imagePath = path.join(storagePath, image.name);
     const reader = new FileReader();

     reader.onload = function (event) {
       if (event.target && event.target.result) {
         const buffer = Buffer.from(event.target.result as ArrayBuffer);
         fs.writeFileSync(imagePath, buffer);
       }
     };

     reader.readAsArrayBuffer(image);
   });
 };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setFormValues({ name: "", description: "", price: 0 });
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormValues({
      name: product.name,
      description: product.description,
      price: product.price,
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (productId: number) => {
    setProducts(products.filter((product) => product.id !== productId));
  };

  const handleSubmitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedProduct) {
      // Edit existing product
      setProducts(
        products.map((product) =>
          product.id === selectedProduct.id
            ? {
                ...product,
                name: formValues.name,
                description: formValues.description,
                price: formValues.price,
              }
            : product
        )
      );
    } else {
      // Add new product
      const newProductId =
        products.length > 0 ? products[products.length - 1].id + 1 : 1;
      const newProduct = {
        id: newProductId,
        name: formValues.name,
        description: formValues.description,
        price: formValues.price,
      };
      await addProduct(newProduct); // Save the new product to MongoDB
      fileUploadHandler(); // Upload images to the server
      setProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
  };


  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">Products</h1>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg focus:outline-none"
              onClick={handleAddProduct}
            >
              <FiPlus className="w-6 h-6 mr-2" /> Add Product
            </button>
          </div>
        </div>
      </header>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {products.length === 0 ? (
            <p className="text-gray-600">No products found.</p>
          ) : (
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${product.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-blue-500 hover:text-blue-600 mr-4"
                        onClick={() => handleEditProduct(product)}
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
      {/* Edit modal */}
      {isModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              ​
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <FiEdit className="w-6 h-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {selectedProduct ? "Edit Product" : "Add Product"}
                  </h3>
                  <div className="mt-2">
                    <form onSubmit={handleSubmitForm}>
                      <div>
                        <div className="flex flex-wrap">
                          {images.map((image, index) => (
                            <div
                              key={index}
                              className="w-1/2 sm:w-1/4 md:w-1/6 p-1"
                            >
                              <img
                                src={URL.createObjectURL(image)}
                                alt={image.name}
                                className="w-full h-auto object-contain"
                              />
                            </div>
                          ))}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple // Add this attribute
                          onChange={fileSelectedHandler}
                        />
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={formValues.name}
                            onChange={(event) =>
                              setFormValues({
                                ...formValues,
                                name: event.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Description
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={formValues.description}
                            onChange={(event) =>
                              setFormValues({
                                ...formValues,
                                description: event.target.value,
                              })
                            }
                          ></textarea>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label
                          htmlFor="price"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Price
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="price"
                            id="price"
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={formValues.price}
                            onChange={(event) =>
                              setFormValues({
                                ...formValues,
                                price: +event.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          type="submit"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg focus:outline-none"
                        >
                          {selectedProduct ? "Save Changes" : "Add Product"}
                        </button>
                        <button
                          className="ml-4 text-gray-500 hover:text-gray-600"
                          onClick={() => setIsModalOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPage
