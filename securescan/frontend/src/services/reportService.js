import api from './api';

const reportService = {
  getDashboard() {
    return api.get('/api/analytics/dashboard');
  },

  downloadReport(scanId) {
    return api.get(`/api/reports/${scanId}/download`, {
      responseType: 'blob',
    });
  },
};

export default reportService;
