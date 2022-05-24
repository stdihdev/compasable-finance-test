import { StrictMode } from "react";
import ReactDOM from "react-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { Web3ReactProvider } from "@web3-react/core";
import { ethers } from "ethers";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "../src/store";

const getLibrary = (provider) => {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 8000; // frequency provider is polling
  return library;
};

export default function Home() {
  return (
    <>
      <StrictMode>
        <ChakraProvider>
          <Web3ReactProvider getLibrary={getLibrary}>
            <Provider store={store}>
              <App />
            </Provider>
          </Web3ReactProvider>
        </ChakraProvider>
      </StrictMode>
    </>
  );
}
