import api from './api';

const scanService = {
  createScan(data) {
    return api.post('/api/scans', data);
  },

  getScans(params = {}) {
    return api.get('/api/scans', { params });
  },

  getScan(scanId) {
    return api.get(`/api/scans/${scanId}`);
  },

  deleteScan(scanId) {
    return api.delete(`/api/scans/${scanId}`);
  },

  getScanFindings(scanId, params = {}) {
    return api.get(`/api/scans/${scanId}/findings`, { params });
  },

  getScanReport(scanId) {
    return api.get(`/api/scans/${scanId}/report`);
  },
};

export default scanService;
