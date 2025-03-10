export interface ClickUpTask {
    id: string
    name: string
    description: string
    status: {
        status: string
    }
    date_created: string
    url: string
}

export async function getClickUpTasks(token: string): Promise<ClickUpTask[]> {
    try {
        // First, get the user's teams
        const teamsResponse = await fetch("https://api.clickup.com/api/v2/team", {
            headers: {
                Authorization: token,
            },
        })

        if (!teamsResponse.ok) {
            throw new Error("Failed to fetch teams")
        }

        const teamsData = await teamsResponse.json()
        const teams = teamsData.teams

        if (!teams || teams.length === 0) {
            return []
        }

        // For each team, get all tasks assigned to the user with "READY FOR AI" status
        let allTasks: ClickUpTask[] = []

        for (const team of teams) {

            const teamId = team.id
            console.log("teamId is ", teamId)

            // Get all spaces in the team
            const spacesResponse = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/space`, {
                headers: {
                    Authorization: token,
                },
            })

            if (!spacesResponse.ok) continue

            const spacesData = await spacesResponse.json()
            const spaces = spacesData.spaces

            if (!spaces || spaces.length === 0) continue

            // For each space, get all folders
            for (const space of spaces) {
                const spaceId = space.id

                console.log("spaceId is ", spaceId)

                const foldersResponse = await fetch(`https://api.clickup.com/api/v2/space/${spaceId}/folder`, {
                    headers: {
                        Authorization: token,
                    },
                })

                if (!foldersResponse.ok) continue

                const foldersData = await foldersResponse.json()
                const folders = foldersData.folders

                if (!folders || folders.length === 0) continue

                // For each folder, get all lists
                for (const folder of folders) {
                    const folderId = folder.id

                    console.log("folderId is ", folderId)
    
                    const listsResponse = await fetch(`https://api.clickup.com/api/v2/folder/${folderId}/list`, {
                        headers: {
                            Authorization: token,
                        },
                    })

                    if (!listsResponse.ok) continue

                    const listsData = await listsResponse.json()
                    const lists = listsData.lists

                    if (!lists || lists.length === 0) continue

                    // For each list, get all tasks
                    for (const list of lists) {
                        const listId = list.id

                        console.log("listId is ", listId)
    
                        const tasksResponse = await fetch(
                            `https://api.clickup.com/api/v2/list/${listId}/task?statuses[]=READY FOR AI`,
                            {
                                headers: {
                                    Authorization: token,
                                },
                            },
                        )

                        if (!tasksResponse.ok) continue

                        const tasksData = await tasksResponse.json()
                        const tasks = tasksData.tasks

                        console.log("tasks are ", tasks)

                        if (tasks && tasks.length > 0) {
                            allTasks = [...allTasks, ...tasks]
                        }
                    }
                }
            }
        }

        return allTasks
    } catch (error) {
        console.error("Error fetching ClickUp tasks:", error)
        return []
    }
}

