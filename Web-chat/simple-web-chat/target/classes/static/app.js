class User{
     #id
     #nickname
     #avatarId
     #avatarUrl

     static #DICE_BEAR_URL ='https://api.dicebear.com/6.x/avataaars/svg?seed='

      constructor(nickname, avatarId) {
             this.#id = nickname + avatarId
             this.#avatarId = avatarId
             this.#avatarUrl = User.#DICE_BEAR_URL + avatarId
             this.#nickname = nickname
         }
      get id() {
              return this.#nickname + this.#avatarId
          }
          get avatarId() {
              return this.#avatarId
          }
          get avatarUrl() {
              return this.#avatarUrl
          }
          get nickname() {
              return this.#nickname
          }
          set nickname(nickname) {
              this.#nickname = nickname
              this.#id = this.#nickname + this.#avatarId
              this.#avatarUrl = User.#DICE_BEAR_URL + this.#avatarId
          }
          shuffleAvatarId() {
              this.#avatarId = new Date().getTime()
              this.#avatarUrl = User.#DICE_BEAR_URL + this.#avatarId
          }
          get json() {
              return JSON.stringify({
                  id: this.#id,
                  nickname: this.#nickname,
                  avatarId: this.#avatarId
              })
          }

  }

class Message {
    #user
    #action
    #comment

    constructor(user, action, comment) {
        this.#user = user
        this.#action = action
        this.#comment = comment
    }
     get json() {
            return JSON.stringify({
                user: {
                    id: this.#user.id,
                    nickname: this.#user.nickname,
                    avatarId: this.#user.avatarId
                },
                action: this.#action,
                comment: this.#comment,
                timestamp: new Date().toISOString()
            })
        }
    }
    class WebSocket {
        #stompClient

        stompClient() {
            return this.#stompClient
        }

        connect(user, callback) {
            const socket = new SockJS('/websocket')
            this.#stompClient = Stomp.over(socket)

            const _webSocket = this;
            const _stompClient = _webSocket.#stompClient
            _stompClient.connect({},
                function (frame) {
                    console.log('Connected: ' + frame)
                    _stompClient.subscribe('/topic/all/messages', function(message) {
                        _webSocket.#handleAllMessage(message)
                    })
                    _stompClient.subscribe('/topic/'+user.id+'/messages', function(message) {
                        _webSocket.#handleUserMessage(message)
                    })
                    callback()
                },
                function() {
                    console.log('Unable to connect to Websocket!')
                }
             )
        }
         disconnect() {
                this.#stompClient.disconnect()
                console.log("Disconnected")
            }

            #handleAllMessage(message) {
                this.#handleUserFeed(message)
                this.#handleUserList(message)
            }

            #handleUserMessage(message) {
                this.#handleUserList(message)
            }

            #handleUserFeed(message) {
                const messageBody = JSON.parse(message.body)
                const user = new User(messageBody.user.nickname, messageBody.user.avatarId)
                const comment = messageBody.comment
                const action = messageBody.action
                const timestamp = messageBody.timestamp

                const event = '<div class="event">'+
                                  '<div class="label">'+
                                      '<img src='+user.avatarUrl+'>'+
                                  '</div>'+
                                  '<div class="content">'+
                                      '<div class="summary">'+
                                          '<a class="user">'+user.nickname+'</a>'+
                                            ' '+
                                            '<em>'+action.toLowerCase()+'</em>'+
                                          '<div class="date">'+moment(timestamp).format('YYYY-MM-DD HH:mm:ss')+'</div>'+
                                      '</div>'+
                                      '<div class="extra text">'+comment+'</div>'+
                                  '</div>'+
                              '</div>'
                $('.feed').prepend(event)
            }

            #handleUserList(message) {
                const messageBody = JSON.parse(message.body)
                const user = new User(messageBody.user.nickname, messageBody.user.avatarId)
                const action = messageBody.action

                const $user = $('#' + user.id)
                if (action === 'JOINED' && $user.length === 0) {
                    const item = '<div class="item" id="'+user.id+'" >'+
                                    '<img class="ui avatar image" src='+user.avatarUrl+'>'+
                                    '<div class="content">'+
                                        '<a class="header">'+user.nickname+'</a>'+
                                    '</div>'+
                                 '</div>'
                    $('.list').prepend(item)
                    $('#' + user.id).transition('glow')
                } else if (action === 'LEFT' && $user.length !== 0) {
                    $user.remove()
                }
            }
        }

        $(function () {
            const webSocket = new WebSocket();
            const user = new User('', new Date().getTime())

            let splide = new Splide('#image-carousel', {
                arrows: false,
                pagination: false
            }).mount()

            $('input.nickname').on('keyup', function(e) {
                const $enterChatBtn = $('#enterChatBtn')
                const nickname = $(this).val()
                if (nickname && hasOnlyLettersAndNumbers(nickname)) {
                    $enterChatBtn.removeClass('disabled')
                } else {
                    $enterChatBtn.addClass('disabled')
                }
            })

            $('input.comment').on('keyup', function(e) {
                const $sendBtn = $('#sendBtn')
                if ($(this).val()) {
                    $sendBtn.removeClass('disabled')
                } else {
                    $sendBtn.addClass('disabled')
                }
            })

            $('.avatarImg')
                .attr("src", user.avatarUrl)
                .hide()
                .one("load", function() {
                    $(this).show()
                    $(".placeholder").hide()
                })
                .each(function() {
                    if(this.complete) {
                        $(this).trigger('load')
                    }
                })

            $('#shuffle').click(function() {
                user.shuffleAvatarId()
                $('.avatarImg').attr("src", user.avatarUrl)
            })

            $('#registerForm').submit(function(e) {
                e.preventDefault()

                const nickname = $("input.nickname").val()
                if (!nickname || !hasOnlyLettersAndNumbers(nickname)) {
                    return
                }
                user.nickname = nickname
                $("div.nickname").text(nickname)

                webSocket.connect(user, function() {
                    const message = new Message(user, 'JOINED', '')
                    webSocket.stompClient().send("/app/chat", {}, message.json)

                    splide.go(1)
                        .on('moved', function (newIndex) {
                            if (newIndex === 1) {
                                $("input.comment").focus()
                            }
                        })
                })
            })

            $('#chatForm').submit(function(e) {
                e.preventDefault()

                const $comment = $('input.comment')
                const comment = $comment.val()

                if (comment.length !== 0) {
                    const message = new Message(user, 'COMMENTED', comment)
                    webSocket.stompClient().send("/app/chat", {}, message.json)
                    $comment.val('')
                }
            })

            $('#leaveChatBtn').click(function() {
                webSocket.disconnect()

                $(".feed").empty()
                $(".list").empty()
                splide.go(0)
            })

            $('input.nickname').focus()

            function hasOnlyLettersAndNumbers(str) {
                const regex = /^[a-zA-Z0-9]+$/
                return regex.test(str)
            }
        })
