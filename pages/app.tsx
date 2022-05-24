import { ContractInterface, ethers } from "ethers";
import classNames from "classnames";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  connectAccount,
  confirming,
  disconnectAccount,
  pendingStarted,
  pendingFinished,
} from "../features/defiStatus";
import { useDisclosure } from "@chakra-ui/react";
import SelectWalletModal from "../src/Modal";
import {
  CDai_Address,
  Dai_Address,
  ROPSTEN_TESTNET,
} from "../constants/ropsten";
import styles from "../styles/Home.module.css";
import CERC20_ABI from "../abis/CErc20Delegator.json";
import ERC20_ABI from "../abis/erc20.json";
import { CErc20Delegator, Erc20 } from "../generated";
import { isAddress } from "ethers/lib/utils";
import { ToastContainer, toast } from "react-toastify";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { useWeb3React } from "@web3-react/core";
import { networkParams } from "../src/networks";
import { connectors } from "../src/connectors";
import { toHex, truncateAddress } from "../src/utils";
import { makeStyles } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";

import theme from "../src/theme";

import LoadingSvg from "../public/loading.svg";
import { shortenAddress } from "../utils";
interface Balances {
  DaiAmount: number;
  CDaiAmount: number;
}

enum DepositingStatus {
  UNKNOWN = 0,
  DEPOSITING = 1,
  DEPOSITED = 2,
}

const useStyles = makeStyles({
  label: {
    color: "rgb(98, 0, 238)",
    marginBottom: "15px",
  },
  header: {
    display: "flex",
    height: "50px",
    backgroundColor: "rgb(98, 0, 238)",
  },
  defilogo: {
    lineHeight: "50px",
    left: "1rem",
    color: "white",
    cursor: "pointer",
    position: "relative",
  },
  connect: {
    textAlign: "right",
    position: "relative",
    marginLeft: "auto",
    lineHeight: "50px",
    color: "#fff",
    borderRadius: "3px",
    marginRight: "15px",
    "&:hover": {
      color: "white",
    },
  },
  connected: {
    textAlign: "right",
    position: "relative",
    marginLeft: "auto",
    color: "#fff",
    borderRadius: "3px",
    height: "2em",
    marginRight: "15px",
  },
  input: {
    backgroundColor: "rgb(237,237,237)",
    borderBottom: "5px solid rgb(98, 0, 238)",
    marginTop: "5px",
    marginBottom: "5px",
    underline: {
      "&&&:before": {
        borderBottom: "none",
      },
      "&&:after": {
        borderBottom: "none",
      },
    },
  },
  myethvalue: {
    fontSize: "15px",
  },
  send: {
    backgroundColor: "rgb(98, 0, 238)",
    color: "white",
    marginTop: "12px",
    "&:hover": {
      backgroundColor: "rgb(98, 0, 238)",
      color: "white",
    },
    "& .Mui-disabled": {
      display: "none",
      backgroundColor: "rgb(239, 230, 253)",
      color: "rgb(150, 150, 150)",
    },
  },

  main: {
    height: "710px",
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
  },
  pendingImg: {
    marginLeft: "2px !important",
    paddingRight: "1px !important",
  },
  disabledButton: {
    marginTop: "8px",
    backgroundColor: "rgb(239, 230, 253)",
    color: "rgb(150, 150, 150)",
  },
  noneShow: {
    a: {
      display: "none !important",
    },
    marginTop: "8px",
    backgroundColor: "rgb(239, 230, 253)",
    color: "rgb(150, 150, 150)",
    display: "none !important",
  },
});

const ToastMsg = ({ hash, amount }: { hash: string; amount: number }) => (
  <div>
    <p className="mb-1">{`Deposited ${amount} DAI`}</p>
    <a
      href={`https://kovan.etherscan.io/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
    >
      View Transaction
    </a>
  </div>
);

const App: NextPage = () => {
  const currentStatus = useSelector((state) => state.statusMan.value);
  const dispatch = useDispatch();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { library, chainId, account, activate, deactivate, active } =
    useWeb3React();
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [network, setNetwork] = useState(undefined);
  const [ethValue, setEthValue] = useState(0);
  const [message, setMessage] = useState("");
  const [signedMessage, setSignedMessage] = useState("");
  const [verified, setVerified] = useState();

  const handleNetwork = (e) => {
    const id = e.target.value;
    setNetwork(Number(id));
  };

  const handleInput = (e) => {
    const msg = e.target.value;
    setMessage(msg);
  };

  const refreshState = () => {
    window.localStorage.setItem("provider", undefined);
    setNetwork("");
    setMessage("");
    setSignature("");
    setVerified(undefined);
  };

  const disconnect = () => {
    refreshState();
    deactivate();
  };

  useEffect(() => {
    const provider = window.localStorage.getItem("provider");
    if (provider) activate(connectors[provider]);
  }, []);

  useEffect(() => {
    if (account !== undefined) {
      getEth(account);
      dispatch(connectAccount());
      console.log(222, account);
      console.log(222, chainId);
    } else {
      dispatch(disconnectAccount());
    }
  }, [account]);

  const classes = useStyles();
  const [myaccount, setMyAccount] = useState<string | undefined>(undefined);
  const [balances, setBalances] = useState<Balances | undefined>(undefined);
  const [isKovanTestNet, setIsKovanTestNet] = useState<boolean>(false);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [targetAddress, setTargetAddress] = useState<string>("");
  const [myTransaction, setMyTransaction] = useState<string>("");
  const [depositing, setDepositing] = useState<DepositingStatus>(
    DepositingStatus.UNKNOWN
  );
  const [pendingTransactions, setPendingTransactions] = useState<Array<String>>(
    []
  );
  const provider = useMemo(
    () =>
      typeof window !== "undefined"
        ? new ethers.providers.Web3Provider(window.ethereum)
        : undefined,
    []
  );

  const signer = useMemo(
    () => (provider ? provider.getSigner() : undefined),
    [provider]
  );

  useEffect(() => {
    const getAccountAddress = async () => {
      try {
        if (!signer || !provider) {
          setMyAccount(undefined);
          setIsKovanTestNet(false);
          return;
        }
        const account = await signer.getAddress();
        const chainId = (await provider.getNetwork()).chainId;
        setMyAccount(account);
        setIsKovanTestNet(chainId === ROPSTEN_TESTNET);
      } catch (err) {
        setMyAccount(undefined);
        setIsKovanTestNet(false);
      }
    };
    getAccountAddress();
  }, [signer, provider]);

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }
    const { ethereum } = window;
    const handleChainChanged = async () => {
      const changedChainId = await ethereum.request({ method: "eth_chainId" });
      setIsKovanTestNet(Number(changedChainId) === ROPSTEN_TESTNET);
    };
    const accountWasChanged = (accounts: string[]) => {
      setMyAccount(accounts[0]);
    };
    const getAndSetAccount = async () => {
      const changedAccounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      await handleChainChanged();
      setMyAccount(changedAccounts[0]);
    };
    const clearAccount = () => {
      setMyAccount(undefined);
    };
    ethereum.on("accountsChanged", accountWasChanged);
    ethereum.on("connect", getAndSetAccount);
    ethereum.on("chainChanged", handleChainChanged);
    ethereum.on("disconnect", clearAccount);
  }, []);

  const daiContract = useMemo(
    () =>
      new ethers.Contract(
        Dai_Address,
        ERC20_ABI as ContractInterface,
        signer
      ) as unknown as Erc20,
    [signer]
  );

  const getEth = async (currentAccount) => {
    const ethers = require("ethers");
    const network = "ropsten";
    const provider = ethers.getDefaultProvider(network);
    const balance = await provider.getBalance(currentAccount);
    let res = ethers.utils.formatEther(balance);
    res = Math.round(res * 1e4) / 1e4;
    setEthValue(res.toFixed(2));
  };

  const getBalances = async () => {
    if (daiContract && myaccount && isAddress(myaccount) && isKovanTestNet) {
      const [DaiAmount, CDaiAmount] = await Promise.all([
        daiContract.balanceOf(myaccount),
      ]);
      setBalances({
        DaiAmount: Number(ethers.utils.formatUnits(DaiAmount, 18)),
        // CDaiAmount: Number(ethers.utils.formatUnits(CDaiAmount, 8)),
      });
    } else {
      setBalances(undefined);
    }
  };

  const connectToMetamask = async () => {
    if (provider) {
      await provider.send("eth_requestAccounts", []);
    }
  };

  const transactionDone = (txHash: string) => {
    const txs = [...pendingTransactions];
    const transaction = txs.find((tx) => tx === txHash);
    if (transaction) {
      console.log(666, transaction);
      dispatch(pendingFinished());
      setMyTransaction(transaction);
      const hashIdx = txs.indexOf(transaction);
      txs.splice(hashIdx, 1);
      setPendingTransactions(txs);
    }
  };

  const deposit = async () => {
    dispatch(confirming());
    console.log(111);
    console.log(222, depositAmount);
    console.log(222, targetAddress);

    setDepositing(DepositingStatus.DEPOSITING);
    try {
      console.log(333, myaccount);
      console.log(333, targetAddress);

      const response = await daiContract.transferFrom(
        myaccount,
        targetAddress,
        ethers.utils.parseEther(depositAmount?.toString())
      );
      const { hash } = response;
      pendingTransactions.push(hash);
      dispatch(pendingStarted());
      response
        .wait()
        .then((res) => {
          transactionDone(hash);
          toast.success(
            <ToastMsg hash={hash} amount={depositAmount}></ToastMsg>
          );
          getBalances();
        })
        .catch((err) => {
          transactionDone(hash);
          toast.error(<ToastMsg hash={hash} amount={depositAmount}></ToastMsg>);
        });
      setDepositing(DepositingStatus.DEPOSITED);
    } catch (err) {
      setDepositing(DepositingStatus.UNKNOWN);
      setShowDepositModal(false);
      setDepositAmount(0);
      console.error(err);
    }
  };

  const hideDepositModal = () => {
    setShowDepositModal(false);
    setDepositing(DepositingStatus.UNKNOWN);
    setDepositAmount(0);
  };

  useEffect(() => {
    getBalances();
  }, [daiContract, myaccount, isKovanTestNet, provider, signer]);

  return (
    <>
      <Head>
        <title>DeFi App</title>
        <meta name="description" content="DeFi Next Typescript" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className={classes.header}>
        <span className={classes.defilogo}>DeFi App</span>
        {account && pendingTransactions.length > 0 ? (
          <Button href="#" className={classes.connect}>
            {`${pendingTransactions.length} Pending`}
            <Image
              className={classes.pendingImg}
              src={LoadingSvg}
              alt="loading"
              width={15}
              height={15}
            />
          </Button>
        ) : account ? (
          <div className={classes.connected}>
            <p>{shortenAddress(account)}</p>
            <p className={classes.myethvalue}>{ethValue} ETH</p>
          </div>
        ) : (
          <Button className={classes.connect} onClick={() => onOpen()}>
            CONNECT WALLET
          </Button>
        )}
      </header>

      <div className={classes.main}>
        <TextField
          className={classes.input}
          sx={{ width: 1 / 4 }}
          id="daiAmount"
          label="Enter DAI Amount"
          defaultValue=""
          variant="filled"
          onChange={(e) => setDepositAmount(Number(e.target.value))}
        />
        <Box component="span" className={classes.label} sx={{ width: 1 / 4 }}>
          {balances && " Balance: " + balances.DaiAmount.toFixed(3) + " DAI "}
        </Box>
        <TextField
          className={classes.input}
          sx={{ width: 1 / 4 }}
          id="recipientsAddress"
          label="Enter recipients address"
          defaultValue=""
          variant="filled"
          onChange={(e) => setTargetAddress(e.target.value)}
        />
        <Button
          classes={{ disabled: classes.disabledButton }}
          className={classes.send}
          color="primary"
          sx={{ width: 1 / 6 }}
          onClick={() => deposit()}
          disabled={
            (targetAddress &&
              depositAmount &&
              depositAmount > balances.DaiAmount) ||
            depositAmount === 0 ||
            targetAddress === "" ||
            currentStatus == "confirming" ||
            currentStatus == "pending" ||
            currentStatus == "transaction"
          }
        >
          SEND
        </Button>
        <Button
          classes={{ disabled: classes.noneShow }}
          className={classes.send}
          color="primary"
          href={"https://ropsten.etherscan.io/tx/" + myTransaction}
          target="_blank"
          sx={{ width: 1 / 6 }}
          rel="noopener noreferrer"
          disabled={pendingTransactions.length > 0 || myTransaction == ""}
        >
          VIEW ON ETHERSCAN
        </Button>
      </div>
      <SelectWalletModal isOpen={isOpen} closeModal={onClose} />
    </>
  );
};

export default App;
