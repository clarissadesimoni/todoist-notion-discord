let tasklistHelper = function () {
    var obj = {};
    const {credentials} = require('./calendar_access');
    const {authorize, getAccessToken, listEvents, listAllEvents, listCalendars, getEvents} = require('./calendar_utility');
    require('dotenv').config();
    const MongoClient = require('mongodb').MongoClient;
    const TodoistApi = require('@doist/todoist-api-typescript').TodoistApi;
    obj.todoist = new TodoistApi(process.env.TODOIST_API_KEY);
    const uri = `mongodb+srv://${process.env.DB_USER_PASSWORD}@todoist-notion-discord.4vi3s.mongodb.net/todoist-notion-discord?retryWrites=true&w=majority`;
    obj.mongodb = new MongoClient(uri);

    function any(iterable) {
        for (var index = 0; index < iterable.length; index++) {
            if (iterable[index]) return true;
        }
        return false;
    }
    function all(iterable) {
        for (var index = 0; index < iterable.length; index++) {
            if (!iterable[index]) return false;
        }
        return true;
    }
    function strMul(str, coefficient) {
        return coefficient >= 2 ? strMul(str, coefficient - 1) + str : str;
    }
    obj.any = any;
    obj.all = all;
    obj.strMul = strMul;

    obj.tasklist = async function(message_user, await_for_token) {

        Date.prototype.getDiscordDate = function() {
            return `${this.getDate().toString().padStart(2, '0')}/${(this.getMonth() + 1).toString().padStart(2, '0')}/${this.getFullYear()}`;
        };
        Date.prototype.getDiscordTime = function() {
            return `${((this.getHours() % 12) + Math.floor(this.getHours() / 12) * 12).toString().padStart(2, '0')}:${this.getMinutes().toString().padStart(2, '0')} ${this.getHours() < 12 ? 'AM' : 'PM'}`;
        };

        await this.mongodb.connect();
        const dbName = 'todoist_notion_discord';
        const collName = 'todoist';
        var sections = [];
        var projects = [];
        var labels = await this.todoist.getLabels();
        var tasklist = await this.todoist.getTasks({filter: 'due:today & @Discord'});
        var today = new Date();
        today = today.setHours(23, 59, 59, 999);
        today = new Date(today);
        const db_results = await this.mongodb.db(dbName).collection(collName).find({}).toArray();
        var db_tasks = [];
        if (db_results.length > 0) {
            db_tasks = db_results.map(obj => obj._id);
            if(db_tasks.length > 0) {
                var task_ids = await this.todoist.getTasks({id: db_tasks}).then(tasks => tasks.filter(task => task.due.date === today.toISOString().split('T')[0]));
                tasklist.push(...task_ids.filter(x => tasklist.filter(y => y.id == x.id).length == 0));
            }
        }
        labels = labels.reduce(function(dest, x) {
            dest[x.name] = x;
            return dest;
        }, {});
        var indent_offsets = {
            project: 0,
            section: 1,
            'task': section_name => section_name ? 2 : 1
        }
        var indent_str = ':blank:';
        var emotes_offset = 21;
        var tab_to_spaces = 4;

        var Project = function(obj) {
            obj.sections = {
                0: Section({id: 0, name: 'No section'})
            };
            obj.priorityDict = function() {
                var data = {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    r: 0
                }
                for(var s in this.sections) {
                    var tmp = this.sections[s].priorityDict();
                    for(var priority in data) data[priority] += tmp[priority]
                }
                return data;
            }
            obj.listTaskIDs = function(completed=[false, true]) {
                var data = [];
                for(var s of Object.values(this.sections)) data.push(...s.listTaskIDs(completed=completed))
                return data;
            }
            obj.completionCount = function(countMig=false, countHabits=true) {
                var done = 0;
                var total = 0;
                for(var s in this.sections) {
                    var tmp = this.sections[s].completionCount(countMig=countMig, countHabits=countHabits);
                    done += tmp[0];
                    total += tmp[1];
                }
                return [done, total];
            }
            obj.completion = function(countMig=false, countHabits=true) {
                var counts = this.completionCount(countMig=countMig, countHabits=countHabits);
                return counts[0]/counts[1];
            }
            obj.toString = function(completed=false) {
                var res = '';
                if (!completed) {
                    var compCount = this.completionCount();
                    res = `**PROJECT: ${this.name}** (Done: ${compCount[0]}/${compCount[1]}: ${(this.completion() * 100).toFixed(2)}%)`;
                } else res = `**PROJECT: ${this.name}**`;
                var sec = Object.values(this.sections);
                sec.sort(function(a, b) {
                    var a_dict = a.priorityDict();
                    var b_dict = b.priorityDict();
                    if(a_dict[1] != b_dict[1]) return b_dict[1] - a_dict[1];
                    else if(a_dict[2] != b_dict[2]) return b_dict[1] - a_dict[1];
                    else if(a_dict[3] != b_dict[3]) return b_dict[2] - a_dict[2];
                    else if(a_dict[4] != b_dict[4]) return b_dict[3] - a_dict[3];
                    else if(a_dict.r != b_dict.r) return b_dict.r - a_dict.r;
                    else return -1;
                });
                res = [[res, res.length]];
                for(var s in this.sections) res.push(...this.sections[s].toString(completed=completed));
                return res;
            }
            return obj;
        }

        var Section = function(obj) {
            obj.tasks = [];
            obj.priorityDict = function() {
                var data = {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    r: 0
                }
                for(var t of this.tasks) {
                    if(t.completed == 0) {
                        if(t.recurring) data.r += 1;
                        else data[5 - t.priority] += 1;
                    }
                }
                return data;
            }
            obj.listTaskIDs = function(completed=[false, true]) {
                var data = [];
                for(var t of this.tasks) data.push(...t.listTaskIDs(completed=completed))
                return data;
            }
            obj.completionCount = function(countMig=false, countHabits=true) {
                var lh = labels['Habit'];
                if(!countMig && !countHabits) var tmp = this.tasks.filter(task => !task.mig && !(task.labels.includes(lh)));
                else if(!countMig && countHabits) var tmp = this.tasks.filter(task => !task.mig);
                else if(countMig && !countHabits) var tmp = this.tasks.filter(task => !(task.labels.includes(lh)));
                else if(countMig && countHabits) var tmp = this.tasks;
                var done = 0;
                var total = 0;
                for(var task of this.tasks) {
                    var tmp = task.isCompleted();
                    done += tmp[0];
                    total += tmp[1];
                }
                return [done, total];
            }
            obj.completion = function(countmig=false, countHabits=true) {
                var counts = this.completionCount(countMig=countmig, countHabits=countHabits);
                return counts[0]/counts[1];
            }
            obj.toString = function(completed=false) {
                var res = '';
                if (!completed) {
                    compCount = this.completionCount();
                    res = `**SECTION: ${this.name}** (Done: ${compCount[0]}/${compCount[1]}: ${(this.completion() * 100).toFixed(2)}%)`;
                } else res = `**SECTION: ${this.name}**`;
                res = this.id != 0 ? [[strMul(indent_str, indent_offsets.section) + res, res.length + (indent_offsets.section * (emotes_offset + indent_str.length))]] : [];
                this.tasks.sort(function (a, b) {
                    if(a.completed != b.completed) return a.completed - b.completed;
                    else if(a.isHabit != b.isHabit) return +a.isHabit - (+b.isHabit);
                    else if(a.priority != b.priority) return b.priority - a.priority;
                    else if(a.due != b.due) return a.due - b.due;
                    else if(any(['PDF', 'Ex', 'Es'].map(el => a.name.startsWith(el))) && any(['PDF', 'Ex', 'Es'].map(el => b.name.startsWith(el)))) return a.name.localeCompare(b.name);
                    else return -1;
                })
                var data = this.tasks.filter(task => task.completed == completed);
                for(var task of data) {
                    if(task.subtasks.length > 0) res.push(...task.toString(this.id != 0, 0, completed))
                    else res.push(task.toString(this.id != 0, 0, completed));
                }
                return res;
            }
            return obj;
        }
        
        var MyTask = async function(source=undefined) {
            var api_obj;
            if(typeof source === 'number') api_obj = await this.todoist.getTask(source);
            else api_obj = source;
            return {
                id: api_obj.id,
                name: api_obj.content,
                parent: api_obj.parentId,
                projectId: api_obj.projectId,
                sectionId: api_obj.sectionId,
                due: new Date(api_obj.due.date),
                recurring: api_obj.due.recurring,
                isHabit: api_obj.labelIds.includes(labels['Habit']),
                mig: !api_obj.due.recurring && (new Date(api_obj.due.date) > today),
                labels: api_obj.labelIds,
                priority: api_obj.priority,
                completed: api_obj.completed == 1 || (api_obj.due.recurring && new Date(api_obj.due.date) > today),
                category: api_obj.labelIds.includes(labels['Easy']) ? 'easy' : api_obj.labelIds.includes(labels['Medium']) ? 'med' : api_obj.labelIds.includes(labels['Hard']) ? 'hard' : 'OOF',
                bullet2: {easy: ':mdot_green: ', med: ':mdot_yellow: ', hard: ':mdot_red: '}[api_obj.labelIds.includes(labels['Easy']) ? 'easy' : api_obj.labelIds.includes(labels['Medium']) ? 'med' : api_obj.labelIds.includes(labels['Hard']) ? 'hard' : 'OOF'] || '',
                subtasks: [],
                bullet: function() {
                    emotes = {
                        1: ':mdot_red',
                        2: ':mdot_yellow',
                        3: ':mdot_blue',
                        4: ':mdot_grey'
                    };
                    var ls = labels['Started'];
                    var [done, total] = this.isCompleted(); // multiple returns: use let[a, b, c...] to save them all
                    if(this.completed) return ':mdot_greencomp: ';
                    else if(this.isHabit) return this.labels.includes(ls) ? ':mdot_lavenderstart: ' : ':mdot_lavender: ';
                    else if(!this.recurring && new Date(api_obj.due.date) > today) return emotes[5 - this.priority] + 'mig: ';
                    else if(this.labels.includes(ls) || (done > 0 && done < total)) return emotes[5 - this.priority] + 'start: ';
                    else return emotes[5 - this.priority] + ': ';
                },
                toString: function(is_section_named, level=0, completed=false) {
                    this.subtasks.sort(function(a, b) {
                        if(a.completed != b.completed) return a.completed - b.completed;
                        else if(a.isHabit != b.isHabit) return +a.isHabit - (+b.isHabit);
                        else if(a.priority != b.priority) return b.priority - a.priority;
                        else if(a.due != b.due) return a.due - b.due;
                        else if(any(['PDF', 'Ex', 'Es'].map(el => a.name.startsWith(el))) && any(['PDF', 'Ex', 'Es'].map(el => b.name.startsWith(el)))) return a.name.localeCompare(b.name);
                        else return -1;
                    })
                    var data = this.subtasks.filter(el => el.completed == completed);
                    var comp = this.isCompleted();
                    var res = `${this.bullet()}${this.name}` + (this.subtasks.length > 0 ? ` (Done: ${comp[0]}/${comp[1]}: ${(comp[0]/comp[1] * 100).toFixed(2)}%)` : '');
                    res = [strMul(indent_str, indent_offsets['task'](is_section_named) + level) + res, res.length + emotes_offset + ((indent_offsets['task'](is_section_named) + level) * (emotes_offset + indent_str.length))];
                    if(data.length > 0) {
                        res = [res];
                        for(var st of data) {
                            if(st.subtasks.length > 0) res.push(...st.toString(is_section_named, level + 1));
                            else res.push(st.toString(is_section_named, level + 1));
                        }
                    }
                    return res;
                },
                listTaskIDs: function(completed=[false, true]) {
                    var data = completed.includes(this.completed) ? [this.id] : [];
                    for(var t of this.subtasks) data.push(...t.listTaskIDs());
                    return data;
                },
                isCompleted: function() {
                    if(this.subtasks.length > 0) {
                        var done = 0;
                        var total = 0;
                        for(var st of this.subtasks) {
                            var tmp = st.isCompleted();
                            done += tmp[0];
                            total += tmp[1];
                        }
                        return [done, total];
                    } else return [+this.completed, 1]
                }
            }
        }

        obj.completionCount = function(countMig=false, countHabits=true) {
            var done = 0;
            var total = 0;
            for(var p of Object.values(projects)) {
                var tmp = p.completionCount(countMig=countMig, countHabits=countHabits);
                done += tmp[0];
                total += tmp[1];
            }
            return [done, total];
        }
        obj.completion = function(countMig=false, countHabits=true) {
            var counts = obj.completionCount(countMig=countMig, countHabits=countHabits);
            return counts[0]/counts[1];
        }

        projects = tasklist.reduce(function(dest, x) {
            if(!dest.includes(x.projectId)) dest.push(x.projectId);
            return dest;
        }, []);
        for(var i = 0; i < projects.length; i++) {
            projects[i] = await this.todoist.getProject(projects[i]);
        }
        projects = projects.reduce(function(dest, x) {
            dest[x.id] = Project(x);
            return dest;
        }, {});
        sections = tasklist.reduce(function(dest, x) {
            if(!dest.includes(x.sectionId) && x.sectionId != 0) dest.push(x.sectionId);
            return dest;
        }, []);
        for(var i = 0; i < sections.length; i++) {
            sections[i] = await this.todoist.getSection(sections[i]);
            projects[sections[i].projectId].sections[sections[i].id] = Section(sections[i]);
        }
        tasklist = tasklist.reduce(function(dest, x) {
            var parentId = x.parentId || 0;
            dest[parentId] = dest[parentId] || [];
            dest[parentId].push(x);
            return dest;
        }, {});
        var parents = [];
        for(var task of tasklist[0]) {
            var res = await MyTask(task);
            parents.push(res);
        }
        for(var task of parents) {
            if(task.id in tasklist)
                for(var i = 0; i < tasklist[t.id].length; i++) {
                    var res = await MyTask(tasklist[t.id][i]);
                    t.subtasks.push(res);
                }
            else task.subtasks = [];
        }
        for(var task of parents) {
            projects[task.projectId].sections[task.sectionId].tasks.push(task);
        }

        var proj = Object.values(projects);
        proj.sort(function(a, b) {
            var a_dict = a.priorityDict();
            var b_dict = b.priorityDict();
            if(a_dict[1] != b_dict[1]) return b_dict[1] - a_dict[1];
            else if(a_dict[2] != b_dict[2]) return b_dict[1] - a_dict[1];
            else if(a_dict[3] != b_dict[3]) return b_dict[2] - a_dict[2];
            else if(a_dict[4] != b_dict[4]) return b_dict[3] - a_dict[3];
            else if(a_dict.r != b_dict.r) return b_dict.r - a_dict.r;
            else return -1;
        });

        var compCountAll = obj.completionCount();
        var completionAll = obj.completion();
        var compCountNormal = obj.completionCount(false);
        var completionNormal = obj.completion(false);
        var hlineNum = 19;
        var headerEmojiDict = {
            0: ':mdot_red:',
            1: ':mdot_yellowstart:',
            2: ':mdot_greencomp:'
        }
        var body = []
        var string = strMul(':hline:', hlineNum) + '\n' + `**${headerEmojiDict[Math.floor(completionNormal * 2)]} DAILY TASKS ${today.getDiscordDate()}** ${headerEmojiDict[Math.floor(completionNormal * 2)]} Last update: ${(new Date()).getDiscordTime()}` + '\n' + strMul(':hline:', hlineNum) + '\n';
        body.push([string, hlineNum * 2 * emotes_offset + string.length]);
        body.push(['', 0]);
        var authorized = await authorize(credentials, message_user, await_for_token);
        var cals = await listCalendars(authorized);
        var events = await getEvents(authorized, cals);
        body.push(...events);
        body.push(['', 0]);
        string = '**TASKS:**';
        body.push([string, string.length]);
        for(var p of proj) body.push(...p.toString());
        string = `\nDone: ${compCountAll[0]}/${compCountAll[1]}: ${completionAll.toFixed(2)}%\nNormal tasks: ${compCountNormal[0]}/${compCountNormal[1]}: ${completionNormal.toFixed(2)}%`;
        body.push([string, string.length]);
        i = 0;
        while(i < body.length - 1) {
            if(body[i][1] + body[i + 1][1] <= 1999) {
                body.splice(i, 2, [body[i][0] + '\n' + body[i + 1][0], body[i][1] + 1 + body[i + 1][1]]);
            } else i += 1;
        }
        var res = body.reduce((acc, x) => acc + '\n\n\n' + x[0], '');
        var id_list = [];
        for(var p of proj) id_list.push(...p.listTaskIDs());
        var to_add = id_list.filter(x => !db_tasks.includes(x));
        if(to_add.length > 0) {
            to_add = to_add.map(x => {
                return {_id: x};
            });
            await this.mongodb.db(dbName).collection(collName).insertMany(to_add);
        }
        await this.mongodb.close();
        // console.log(res);
        return body;
    }
    return obj;
}

// (async() => {
//     await tasklistHelper.tasklist();
// });


tasklistHelper().tasklist();

module.exports = tasklistHelper();