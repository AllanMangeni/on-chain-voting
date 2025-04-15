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

import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Pagination, Popconfirm, Popover, Row, Table, Tooltip, message } from "antd";
import axios from 'axios';
import { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from "react-router-dom";
import { useFipList, useTransactionHash } from '../../../common/store';
import type { BaseError } from "wagmi";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import votingFipeditorAbi from "../../../common/abi/power-voting-fipeditor.json";
import {
  HAVE_APPROVED_MSG,
  STORING_DATA_MSG,
  STORING_FAILED_MSG,
  calibrationChainId,
  getFipListApi,
  getFipProposalApi,
  web3AvatarUrl
} from "../../../common/consts";
import EllipsisMiddle from "../../../components/EllipsisMiddle";
import Loading from "../../../components/Loading";
import { getContractAddress } from "../../../utils";
import "./index.less";
const FipEditorApprove = () => {
  const { isConnected, address, chain } = useAccount();
  const { t } = useTranslation();
  const chainId = chain?.id || calibrationChainId;
  const navigate = useNavigate();
  const prevAddressRef = useRef(address);
  const [messageApi, contextHolder] = message.useMessage();

  const [fipProposalList, setFipProposalList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalSize, setTotalSize] = useState(0)
  const [loading, setLoading] = useState(false);
  const [currentProposalId, setCurrentProposalId] = useState(null);
  const { fipList, isFipEditorAddress } = useFipList((state: any) => state.data);
  const setStoringHash = useTransactionHash((state: any) => state.setTransactionHash)
  const storingHash = useTransactionHash((state: any) => state.transactionHash)
  const setFipList = useFipList((state: any) => state.setFipList)

  const {
    data: hash,
    writeContract,
    error: writeContractError,
    isPending: writeContractPending,
    isSuccess: writeContractSuccess,
    reset
  } = useWriteContract();

  const { isLoading: transactionLoading, isSuccess, isFetched, isError } =
    useWaitForTransactionReceipt({
      hash: storingHash?.approve,
    })

  const isLoading = loading || writeContractPending || transactionLoading;

  const popoverColumns = [
    {
      title: t('content.FIPEditor'),
      dataIndex: 'address',
      key: 'address',
      width: 280,
      render: (value: string) => {
        return (
          <div className="w-[180px] flex items-center">
            <img className="w-[20px] h-[20px] rounded-full mr-2" src={`${web3AvatarUrl}:${value}`} alt="" />
            <a
              className="text-black hover:text-black"
              target="_blank"
              rel="noopener"
              href={`${chain?.blockExplorers?.default.url}/address/${value}`}
            >
              {EllipsisMiddle({ suffixCount: 8, children: value })}
            </a>
          </div>
        )
      }
    },
    {
      title: t('content.status'),
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => value ? t(`content.approved`) : '-'
    },
  ]

  const columns = [
    {
      title: t('content.address'),
      dataIndex: 'address',
      key: 'address',
      width: 280,
      render: (value: string) => {
        return (
          <div className="w-[180px] flex items-center">
            <img className="w-[20px] h-[20px] rounded-full mr-2" src={`${web3AvatarUrl}:${value}`} alt="" />
            <a
              className="text-black hover:text-black"
              target="_blank"
              rel="noopener"
              href={`${chain?.blockExplorers?.default.url}/address/${value}`}
            >
              {EllipsisMiddle({ suffixCount: 8, children: value })}
            </a>
          </div>
        )
      }
    },
    {
      title: <div><div>{t('content.info')}</div></div>,
      dataIndex: 'info',
      key: 'info',
      ellipsis: { showTitle: false },
      render: (value: string) => {
        return (
          value ? <Tooltip overlayClassName="custom-tooltip" color="#ffffff" placement="topLeft" title={value}>
            {value}
          </Tooltip> : '-'
        )
      }
    },
    {
      title: t('content.approveRatio'),
      dataIndex: 'ratio',
      key: 'ratio',
      render: (value: string, record: any) => {
        return (
          <div className='flex items-center gap-2'>
            <span>{value}</span>
            <Popover content={
              <Table
                rowKey={(record: any) => record.address}
                dataSource={record.voteList}
                columns={popoverColumns}
                pagination={false}
              />
            }>
              <InfoCircleOutlined style={{ fontSize: 14, cursor: 'pointer' }} />
            </Popover>
          </div>
        )
      }
    },
    {
      title: t('content.action'),
      key: 'total',
      align: 'center' as const,
      width: 120,
      render: (_: any, record: any) => {
        const disabled = !!record.voteList.find((item: any) => item.address === address && item.status === "approved");
        return (
          <Popconfirm
            title={t('content.approveFIPEditor')}
            description={t('content.isConfirmApprove')}
            onConfirm={() => { confirm(record) }}
            okText={t('content.yes')}
            cancelText={t('content.no')}
          >
            <Button type='primary' className='w-[80px] h-[24px] flex justify-center items-center' loading={record.proposalId === currentProposalId && isLoading} disabled={disabled}>{disabled ? t('content.approved') : t('content.approve')}</Button>
          </Popconfirm>
        )
      }

    },
  ];
  const initState = async () => {
    const arr: any = [];
    const params = {
      chainId,
      page,
      pageSize: 5,
      proposalType: 1
    }
    try {
      const { data: { data: { total, list } } } = await axios.get(getFipProposalApi, { params });
      setTotalSize(total)
      list.map((item: any) => {
        arr.push({
          proposalId: item.proposalId,
          address: item.candidateAddress,
          info: item.candidateInfo,
          votedAddresss: item.votedAddresss,
          ratio: `${item.votedAddresss.length} / ${fipList?.length}`,
          voteList: fipList?.map((e: any) => {
            return { address: e.editor, status: item.votedAddresss?.includes(e.editor) ? "approved" : '' }
          }).sort((a: any) => (a.status ? -1 : 1))
        });
      });
    } catch (e) {
      console.log(e)
    }
    setFipProposalList(arr);
    setLoading(false);
  }
  useEffect(() => {
    if (!isConnected || !isFipEditorAddress) {
      navigate("/home");
      return;
    }
  }, [isConnected, isFipEditorAddress]);

  useEffect(() => {
    const prevAddress = prevAddressRef.current;
    if (prevAddress !== address) {
      navigate("/home");
    }
  }, [address]);


  useEffect(() => {
    if (writeContractError) {
      messageApi.open({
        type: 'error',
        content: (writeContractError as BaseError)?.shortMessage || writeContractError?.message,
      });
    }
    reset();
  }, [writeContractError]);

  const getFipList = async () => {
    const params = {
      chainId,
    }
    const { data: { data: fipList } } = await axios.get(getFipListApi, { params });
    setFipList(fipList, address)
  }
  useEffect(() => {
    if (chainId) {
      setLoading(true);
      getFipList()
      initState();
    }
  }, [chain, page, address, isSuccess]);
  useEffect(() => {
    if (isFetched) {
      if (isSuccess) {
        getFipList()
        initState();
      }
      // If the transaction fails, show an error message
      if (isError) {
        messageApi.open({
          type: 'error',
          content: t(STORING_FAILED_MSG)
        })
      }
    }
  }, [isFetched]);

  useEffect(() => {
    if (writeContractSuccess) {
      messageApi.open({
        type: 'success',
        content: t(STORING_DATA_MSG),
      });
      setStoringHash({ 'approve': hash })
      setTimeout(() => {
        navigate("/home")
      }, 1000);
    }
  }, [writeContractSuccess]);


  const handlePageChange = (page: number) => {
    setPage(page);
  }

  const confirm = (record: any) => {
    if (record.votedAddresss.includes(address)) {
      messageApi.open({
        type: 'warning',
        content: t(HAVE_APPROVED_MSG),
      });
      return;
    }
    writeContract({
      abi: votingFipeditorAbi,
      address: getContractAddress(chainId, 'powerVotingFip'),
      functionName: 'voteFipEditorProposal',
      args: [
        record.proposalId,
      ],
    });
    setCurrentProposalId(record.proposalId);
  };
  return (
    <div className="px-3 mb-6 md:px-0">
      {contextHolder}
      <button>
        <div className="inline-flex items-center mb-8 gap-1 text-skin-text hover:text-skin-link">
          <Link to="/home" className="flex items-center">
            <svg className="mr-1" viewBox="0 0 24 24" width="1.2em" height="1.2em">
              <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="m11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            {t('content.back')}
          </Link>
        </div>
      </button>
      <div className='min-w-full bg-[#ffffff] text-left rounded-xl border-[1px] border-solid border-[#DFDFDF] overflow-hidden'>
        <div className='flow-root space-y-4'>
          <div className='font-normal text-black px-8 py-7 text-2xl border-b border-[#eeeeee] flex items-center'>
            <span>{t('content.fipEditorApprove')}</span>
          </div>
          {loading ? <Loading /> :
            <div className='px-8 pb-4 !mt-0'>
              <Table
                className='mb-4'
                rowKey={(record: any) => record.proposalId}
                dataSource={fipProposalList}
                columns={columns}
                pagination={false}
              />
              {
                totalSize > 5 && <Row justify='end'>
                  <Pagination
                    simple
                    current={page}
                    pageSize={pageSize}
                    total={totalSize}
                    onChange={handlePageChange}
                  />
                </Row>
              }
            </div>
          }
        </div>
      </div>
    </div>
  )
}

export default FipEditorApprove;
