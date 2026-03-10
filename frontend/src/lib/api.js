const API = 'http://localhost:8000'

async function request(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || 'API Error')
    }
    return res.json()
}

// ─── Auth / Users ──────────────────────────────────────────────────
export const getUsers = () => request('/auth/users')
export const createUser = (data) => request('/auth/users', { method: 'POST', body: JSON.stringify(data) })
export const updateUser = (id, data) => request(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const getWorkload = () => request('/auth/workload')
export const getTemplates = () => request('/auth/templates')
export const createTemplate = (data) => request('/auth/templates', { method: 'POST', body: JSON.stringify(data) })

// ─── Projects ──────────────────────────────────────────────────────
export const getDashboard = () => request('/projects/dashboard')
export const getProjects = (status) => request(`/projects/${status ? `?status=${status}` : ''}`)
export const globalSearch = (q) => request(`/projects/search?q=${encodeURIComponent(q)}`)
export const getProject = (id) => request(`/projects/${id}`)
export const createProject = (data) => request('/projects/', { method: 'POST', body: JSON.stringify(data) })
export const updateProject = (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteProject = (id) => request(`/projects/${id}`, { method: 'DELETE' })
export const getProjectActivity = (id, limit = 30) => request(`/projects/${id}/activity?limit=${limit}`)

// ─── AI / Analytics ────────────────────────────────────────────────
export const getProjectRisk = (id) => request(`/ai/project/${id}/risk`)
export const getProjectHealth = (id) => request(`/ai/project/${id}/health`)
export const getTaskSuggestions = (id) => request(`/ai/project/${id}/suggestions`)
export const getTeamWorkloadRisk = () => request('/ai/team/workload')
export const getUserAIProfile = (userId) => request(`/ai/user/${userId}/profile`)
export const addProjectMember = (id, data) => request(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(data) })
export const removeProjectMember = (id, userId) => request(`/projects/${id}/members/${userId}`, { method: 'DELETE' })

// ─── Documents ─────────────────────────────────────────────────────
export const getDocuments = (projectId) => request(`/projects/${projectId}/documents`)
export const deleteDocument = (projectId, docId) => request(`/projects/${projectId}/documents/${docId}`, { method: 'DELETE' })
export const uploadDocument = (projectId, params) =>
    request(`/projects/${projectId}/documents?${new URLSearchParams(params)}`, { method: 'POST' })

// ─── Threads ───────────────────────────────────────────────────────
export const getThreads = (projectId) => request(`/projects/${projectId}/threads`)
export const createThread = (projectId, data) => request(`/projects/${projectId}/threads`, { method: 'POST', body: JSON.stringify(data) })
export const addThreadComment = (projectId, threadId, data) =>
    request(`/projects/${projectId}/threads/${threadId}/comments`, { method: 'POST', body: JSON.stringify(data) })

// ─── Milestones ────────────────────────────────────────────────────
export const getMilestones = (projectId) => request(`/milestones/project/${projectId}`)
export const createMilestone = (projectId, data) => request(`/milestones/project/${projectId}`, { method: 'POST', body: JSON.stringify(data) })
export const updateMilestone = (id, data) => request(`/milestones/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteMilestone = (id) => request(`/milestones/${id}`, { method: 'DELETE' })

// ─── Tasks ─────────────────────────────────────────────────────────
export const getTasks = (projectId, params = {}) =>
    request(`/tasks/project/${projectId}?${new URLSearchParams(params)}`)
export const searchTasks = (projectId, q) => request(`/tasks/project/${projectId}/search?q=${encodeURIComponent(q)}`)
export const getTask = (id) => request(`/tasks/${id}`)
export const createTask = (projectId, data, createdBy) =>
    request(`/tasks/project/${projectId}${createdBy ? `?created_by=${createdBy}` : ''}`, { method: 'POST', body: JSON.stringify(data) })
export const updateTask = (id, data, updatedBy) =>
    request(`/tasks/${id}${updatedBy ? `?updated_by=${updatedBy}` : ''}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' })
export const addComment = (taskId, data) => request(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify(data) })
export const logTime = (taskId, data) => request(`/tasks/${taskId}/time`, { method: 'POST', body: JSON.stringify(data) })
export const getMyTasks = (userId) => request(`/tasks/user/${userId}`)
export const requestApproval = (taskId, data) => request(`/tasks/${taskId}/approvals`, { method: 'POST', body: JSON.stringify(data) })
export const respondApproval = (taskId, approvalId, params) =>
    request(`/tasks/${taskId}/approvals/${approvalId}?${new URLSearchParams(params)}`, { method: 'PATCH' })

// ─── Notifications ─────────────────────────────────────────────────
export const getNotifications = (userId) => request(`/notifications/${userId}`)
export const markNotificationsRead = (userId) => request(`/notifications/${userId}/read-all`, { method: 'POST' })
