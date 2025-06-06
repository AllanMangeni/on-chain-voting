// Code generated by MockGen. DO NOT EDIT.
// Source: github.com/ybbus/jsonrpc/v3 (interfaces: RPCClient)

// Package mock is a generated GoMock package.
package mock

import (
	context "context"
	reflect "reflect"

	gomock "github.com/golang/mock/gomock"
	jsonrpc "github.com/ybbus/jsonrpc/v3"
)

// MockRPCClient is a mock of RPCClient interface.
type MockRPCClient struct {
	ctrl     *gomock.Controller
	recorder *MockRPCClientMockRecorder
}

// MockRPCClientMockRecorder is the mock recorder for MockRPCClient.
type MockRPCClientMockRecorder struct {
	mock *MockRPCClient
}

// NewMockRPCClient creates a new mock instance.
func NewMockRPCClient(ctrl *gomock.Controller) *MockRPCClient {
	mock := &MockRPCClient{ctrl: ctrl}
	mock.recorder = &MockRPCClientMockRecorder{mock}
	return mock
}

// EXPECT returns an object that allows the caller to indicate expected use.
func (m *MockRPCClient) EXPECT() *MockRPCClientMockRecorder {
	return m.recorder
}

// Call mocks base method.
func (m *MockRPCClient) Call(arg0 context.Context, arg1 string, arg2 ...interface{}) (*jsonrpc.RPCResponse, error) {
	m.ctrl.T.Helper()
	varargs := []interface{}{arg0, arg1}
	for _, a := range arg2 {
		varargs = append(varargs, a)
	}
	ret := m.ctrl.Call(m, "Call", varargs...)
	ret0, _ := ret[0].(*jsonrpc.RPCResponse)
	ret1, _ := ret[1].(error)
	return ret0, ret1
}

// Call indicates an expected call of Call.
func (mr *MockRPCClientMockRecorder) Call(arg0, arg1 interface{}, arg2 ...interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	varargs := append([]interface{}{arg0, arg1}, arg2...)
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "Call", reflect.TypeOf((*MockRPCClient)(nil).Call), varargs...)
}

// CallBatch mocks base method.
func (m *MockRPCClient) CallBatch(arg0 context.Context, arg1 jsonrpc.RPCRequests) (jsonrpc.RPCResponses, error) {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "CallBatch", arg0, arg1)
	ret0, _ := ret[0].(jsonrpc.RPCResponses)
	ret1, _ := ret[1].(error)
	return ret0, ret1
}

// CallBatch indicates an expected call of CallBatch.
func (mr *MockRPCClientMockRecorder) CallBatch(arg0, arg1 interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "CallBatch", reflect.TypeOf((*MockRPCClient)(nil).CallBatch), arg0, arg1)
}

// CallBatchRaw mocks base method.
func (m *MockRPCClient) CallBatchRaw(arg0 context.Context, arg1 jsonrpc.RPCRequests) (jsonrpc.RPCResponses, error) {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "CallBatchRaw", arg0, arg1)
	ret0, _ := ret[0].(jsonrpc.RPCResponses)
	ret1, _ := ret[1].(error)
	return ret0, ret1
}

// CallBatchRaw indicates an expected call of CallBatchRaw.
func (mr *MockRPCClientMockRecorder) CallBatchRaw(arg0, arg1 interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "CallBatchRaw", reflect.TypeOf((*MockRPCClient)(nil).CallBatchRaw), arg0, arg1)
}

// CallFor mocks base method.
func (m *MockRPCClient) CallFor(arg0 context.Context, arg1 interface{}, arg2 string, arg3 ...interface{}) error {
	m.ctrl.T.Helper()
	varargs := []interface{}{arg0, arg1, arg2}
	for _, a := range arg3 {
		varargs = append(varargs, a)
	}
	ret := m.ctrl.Call(m, "CallFor", varargs...)
	ret0, _ := ret[0].(error)
	return ret0
}

// CallFor indicates an expected call of CallFor.
func (mr *MockRPCClientMockRecorder) CallFor(arg0, arg1, arg2 interface{}, arg3 ...interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	varargs := append([]interface{}{arg0, arg1, arg2}, arg3...)
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "CallFor", reflect.TypeOf((*MockRPCClient)(nil).CallFor), varargs...)
}

// CallRaw mocks base method.
func (m *MockRPCClient) CallRaw(arg0 context.Context, arg1 *jsonrpc.RPCRequest) (*jsonrpc.RPCResponse, error) {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "CallRaw", arg0, arg1)
	ret0, _ := ret[0].(*jsonrpc.RPCResponse)
	ret1, _ := ret[1].(error)
	return ret0, ret1
}

// CallRaw indicates an expected call of CallRaw.
func (mr *MockRPCClientMockRecorder) CallRaw(arg0, arg1 interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "CallRaw", reflect.TypeOf((*MockRPCClient)(nil).CallRaw), arg0, arg1)
}