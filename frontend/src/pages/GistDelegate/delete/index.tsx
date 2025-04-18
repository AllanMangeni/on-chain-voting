// Copyright (C) 2023-2024 StorSwift Inc.
// This file is part of the PowerVoting library.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at:
// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { message } from 'antd';
import classNames from 'classnames';
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { BaseError } from "wagmi";
import { useAccount, useSignMessage, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  GITHUB_STEP_1,
  GITHUB_STEP_2,
  JWT_HEADER,
  OPERATION_CANCELED_MSG,
  STORING_DATA_MSG
} from "../../../common/consts";
import LoadingButton from "../../../components/LoadingButton";
import Table from '../../../components/Table';
import { stringToBase64Url, validateValue } from "../../../utils";
import './index.less';
const GistDelegateDelete = () => {
  const { isConnected, address } = useAccount();
  const { t } = useTranslation();
  const { signMessageAsync } = useSignMessage();
  const { openConnectModal } = useConnectModal();
  const navigate = useNavigate();
  const prevAddressRef = useRef(address);
  const [messageApi, contextHolder] = message.useMessage();

  const location = useLocation();
  const params = location.state?.params;

  const [githubSignature, setGithubSignature] = useState('');
  const [githubStep, setGithubStep] = useState(GITHUB_STEP_1);
  const [formValue] = useState({
    aud: '',
    prf: '',
    owner: '',
    repo: '',
    url: '',
    token: '',
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm({
    defaultValues: {
      ...formValue,
    }
  });

  const {
    data: hash,
    error,
    isPending: writeContractPending,
    isSuccess: writeContractSuccess,
    reset: resetWriteContract
  } = useWriteContract();
  const [loading, setLoading] = useState<boolean>(writeContractPending);

  const { isLoading: transactionLoading } =
    useWaitForTransactionReceipt({
      hash,
    })

  useEffect(() => {
    if (!isConnected) {
      navigate("/home");
      return;
    }
  }, []);

  useEffect(() => {
    const prevAddress = prevAddressRef.current;
    if (prevAddress !== address) {
      navigate("/home");
    }
  }, [address]);

  useEffect(() => {
    if (writeContractSuccess) {
      messageApi.open({
        type: 'success',
        content: t(STORING_DATA_MSG),
      });
      setTimeout(() => {
        navigate("/home");
      }, 3000);
    }
  }, [writeContractSuccess])

  useEffect(() => {
    if (error) {
      messageApi.open({
        type: 'error',
        content: (error as BaseError)?.shortMessage || error?.message,
      });
    }
    resetWriteContract();
  }, [error]);

  const onSubmit = (values: any, githubStep?: number) => {

    if (params?.isGithubType) {
      switch (githubStep) {
        case GITHUB_STEP_1:
          createSignature();
          break;
        case GITHUB_STEP_2:
          deAuthorizeGithubValue(values);
          break;
      }
    } else {
      deAuthorizeFilecoinValue(values);
    }
  }

  const setValue = async (value: string) => {
    console.log('valueTodo', value)
    //TODO
    setLoading(false);
  }

  /**
   * deAuthorize FileCoin 
   * @param values
   */
  const deAuthorizeFilecoinValue = async (values: any) => {
    setLoading(true);
    const { aud } = params;
    const { prf } = values;
    // Check if 'aud' or 'prf' is missing
    if (!aud || !prf) {
      return;
    }

    // Define  parameters
    const gistParams = {
      iss: address,
      aud,
      prf,
      act: 'del',
    }

    // Convert JWT header to base64
    const base64Header = stringToBase64Url(JSON.stringify(JWT_HEADER));
    // Convert parameters to base64
    const base64Params = stringToBase64Url(JSON.stringify(gistParams));
    let signature = '';
    try {
      // Sign the message using the signer
      signature = await signMessageAsync({ message: `${base64Header}.${base64Params}` })
    } catch (e) {
      messageApi.open({
        type: 'error',
        content: t(OPERATION_CANCELED_MSG),
      });
      setLoading(false);
      return;
    }
    // Convert signature to base64
    const base64Signature = stringToBase64Url(signature);
    // Concatenate base64-encoded header, parameters, and signature to form the gist
    const value = `${base64Header}.${base64Params}.${base64Signature}`;
    setValue(value);
  }

  const createSignature = async () => {
    setLoading(true);
    if (isConnected) {
      try {
        const { aud } = params;
        if (!aud) {
          return;
        }
        // Define signature parameters
        const signatureParams = {
          iss: address,
          aud,
          prf: '',
          act: 'del',
        }

        // Convert header and params to base64 URL
        const base64Header = stringToBase64Url(JSON.stringify(JWT_HEADER));
        const base64Params = stringToBase64Url(JSON.stringify(signatureParams));
        let signature = '';
        try {
          // Sign the concatenated header and params
          signature = await signMessageAsync({ message: `${base64Header}.${base64Params}` })
        } catch (e) {
          messageApi.open({
            type: 'error',
            content: t(OPERATION_CANCELED_MSG),
          });
          setLoading(false);
          return;
        }
        // Convert signature to base64 URL
        const base64Signature = stringToBase64Url(signature);

        // Concatenate header, params, and signature
        const githubSignatureParams = `${base64Header}.${base64Params}.${base64Signature}`;

        // Set GitHub signature and step
        setGithubSignature(githubSignatureParams);
        setGithubStep(GITHUB_STEP_2);
      } catch (e) {
        console.log(e);
      }
    } else {
      openConnectModal && openConnectModal();
    }
    setLoading(false);
  }

  const deAuthorizeGithubValue = async (values: any) => {
    setLoading(true);
    const { url } = values;
    setValue(url);
  }


  const githubSignatureList = [
    {
      name: t('content.issuer'),
      width: 100,
      comp: (
        <input
          disabled
          value={address}
          className='form-input w-[520px] text-black  rounded bg-[#ffffff] border border-[#eeeeee] cursor-not-allowed'
        />
      )
    },
    {
      name: t('content.audience'),
      width: 100,
      comp: (
        <input
          disabled
          className='form-input w-[520px] rounded bg-[#ffffff] border border-[#eeeeee] text-[#4B535B] cursor-not-allowed'
          value={params?.aud || ''}
        />
      )
    },
  ];

  const githubAuthorizeList = [
    {
      name: t('content.signature'),
      width: 100,
      comp: (
        <textarea
          disabled
          value={githubSignature}
          className='form-input h-[320px] w-full rounded text-black bg-[#ffffff] border border-[#eeeeee] cursor-not-allowed'
        />
      )
    },
    {
      name: 'URL',
      width: 100,
      comp: (
        <>
          <Controller
            name="url"
            control={control}
            render={() => <input
              className={classNames(
                'form-input w-full rounded bg-[#ffffff] border border-[#eeeeee] text-black',
                errors.url && 'border-red-500 focus:border-red-500'
              )}
              {...register('url', { required: true, validate: validateValue })}
            />}
          />
          {errors.url && (
            <p className='text-red-500 mt-1'>{t('content.uRLRequired')}</p>
          )}
        </>
      )
    },
  ];


  const renderGithubSignature = () => {
    return (
      <form onSubmit={handleSubmit(value => { onSubmit(value, GITHUB_STEP_1) })}>
        <div className='flow-root space-y-8'>
          <Table
            title={t('content.githubDelegatesDeauthorize')}
            list={githubSignatureList}
          />

          <div className='text-center'>
            <LoadingButton text={t('content.sign')} loading={loading || writeContractPending || transactionLoading} />
          </div>
        </div>
      </form>
    )
  }

  const renderGithubDeauthorize = () => {
    return (
      <form onSubmit={handleSubmit(value => { onSubmit(value, GITHUB_STEP_2) })}>
        <div className='flow-root space-y-8'>
          <Table title={t('content.githubDelegatesDeauthorize')} list={githubAuthorizeList} />

          <div className='text-center'>
            <button
              className={`h-[40px] bg-sky-500 hover:bg-sky-700 text-white py-2 px-6 rounded-xl disabled:opacity-50 mr-8 ${loading && 'cursor-not-allowed'}`}
              type='button' onClick={() => { setGithubStep(GITHUB_STEP_1) }}>
              {t('content.previous')}
            </button>
            <LoadingButton className='!bg-red-500 !hover:bg-red-700' text={t('content.deauthorize')} loading={loading || writeContractPending || transactionLoading} />
          </div>
        </div>
      </form>
    )
  }

  const renderForm = () => {

    switch (githubStep) {
      case GITHUB_STEP_1:
        return renderGithubSignature();
      case GITHUB_STEP_2:
        return renderGithubDeauthorize()
    }
  }

  return (
    <>
      {contextHolder}
      <div className="px-3 mb-6 md:px-0">
        <button>
          <div className="inline-flex items-center gap-1 mb-8  text-skin-text hover:text-skin-link">
            <Link to="/home" className="flex items-center">
              <svg className="mr-1" viewBox="0 0 24 24" width="1.2em" height="1.2em">
                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="m11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              {t('content.back')}
            </Link>
          </div>
        </button>
      </div>
      {
        renderForm()
      }
    </>
  )
}

export default GistDelegateDelete;
