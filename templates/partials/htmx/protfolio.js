from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
    from django.contrib import messages in
        from django.http import HttpResponse
    from django.contrib.auth.models import User
    from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.db.models import Q


    from .models import(
        Yomi,
        Comment,
        Like,
        LikeComment,
        Repost,
        RepostComment,
        Follow,
        Notification,
    )
from.utils import(
    create_yomi_post,
    create_yomi_images,
    create_cmt,
    create_cmt_images,
)


@login_required
def home(request):
return redirect("yomi:feed")


@login_required
def feed(request):
Yomi = Yomi.objects.all()
paginator = Paginator(yomi, 7)
page_num = request.GET.get("page") or 1

try:
page_obj = paginator.page(page_num)
    except PageNotAnInteger:
pagenum = 1
    except EmptyPage:
pagenum = 1

pageobj = paginator.page(page_num)
context = { "yomi": pageobj, "following": False }
if request.META.get("HTTP_HX_REQUEST") and int(page_num) > 1:
return render(request, "yomi/partials/_more_feed.html", context)
if request.META.get("HTTP_HX_REQUEST"):
    return render(request, "yomi/partials/_feed.html", context)
return render(request, "yomi/f_feed.html", context)


@login_required
def following_feed(request):
following = request.user.following.all()
    # Create a list of user IDs of the users that the authenticated user is following
following_user_ids = [follow.followed.id for follow in following]

    # Use Q objects to construct an OR query to filter Yomis
Yomi_of_following_users = Yomi.objects.filter(
    Q(user_id_in = following_user_ids)
).distinct()

paginator = Paginator(yomi_of_following_users, 7)
page_num = request.GET.get("page") or 1

try:
page_obj = paginator.page(page_num)
    except PageNotAnInteger:
page_num = 1
    except EmptyPage:
page_num = 1

page_obj = paginator.page(page_num)
context = { "yomi": page_obj, "following": True }
if request.META.get("HTTP_HX_REQUEST") and int(page_num) > 1:
return render(request, "yomi/partials/_more_feed.html", context)
if request.META.get("HTTP_HX_REQUEST"):
    return render(request, "yomi/partials/_feed.html", context)
return render(request, "yomi/f_feed.html", context)


@login_required
def create_yomi(request):
if request.method == "POST":
    content_list = request.POST.getlist("content")
image_count_list = request.POST.getlist("image_count")
image_list = request.FILES.getlist("yomi_images")

        # Ensure thred content and Yomi images are not both empty.
if len(contentlist[0]) == 0 and int(image_countlist[0]) == 0:
messages.warning(
    request, "You have to provide some content to create tale."
)
return redirect("yomi:feed")
        # One unit case, just create a Yomi
if len(content_list) == 1:
            # create yomi
Yomi = create_yomi_post(content_list[0], request.user)
create_yomi_images(image_list, yomi)
        # Two unit case, create yomi and create comment
if len(content_list) == 2:
            # create yomi
yomi = create_yomi_post(content_list[0], request.user)
right = int(image_count_list[0])
create_yomi_images(image_list[: right], yomi)
            # create comment
comment = create_cmt(content_list[1], request.user, yomi)
left = int(image_count_list[0])
right = left + int(image_count_list[1])
create_cmt_images(image_list[left: right], comment)
        # More thatn two units, create yomi, comment and child cmts
if len(content_list) > 2:
            # create yomi
yomi = create_yomi_post(content_list[0], request.user)
right = int(image_count_list[0])
create_yomi_images(image_list[: right], yomi)
            # create parent comment
comment = create_cmt(content_list[1], request.user, yomi)
left = int(image_count_list[0])
right = left + int(image_count_list[1])
create_cmt_images(image_list[left: right], comment)
            # create child comments
i = 2
while i < len(content_list):
    child_cmt = create_cmt(
        content_list[i], request.user, yomi, parent_comment = comment
    )
left = 0
for j in range(i):
    left += int(image_count_list[j])
right = left + int(image_count_list[i])
create_cmt_images(image_list[left: right], comment = child_cmt)
i += 1

messages.success(request, "Tale created successfully.")
return redirect("yomi:feed")
    else:
return redirect("yomi:feed")


@login_required
def get_Yomi_form_unit(request):
if request.META.get("HTTP_HX_REQUEST"):
    return render(request, "partials/htmx/_yomi_form_unit.html")
return redirect("yomi:feed")


@login_required
def get_yomi_reply_form(request, id):
if request.META.get("HTTP_HX_REQUEST"):
    yomi = get_object_or_404(yomi, pk = id)
context = { "yomi": Yomi }
return render(request, "partials/htmx/_yomi_reply_form.html", context)
return redirect("yomi:feed")


@login_required
def get_comment_reply_form(request, id):
if request.META.get("HTTP_HX_REQUEST"):
    comment = get_object_or_404(Comment, pk = id)
context = { "comment": comment }
return render(request, "partials/htmx/_comment_reply_form.html", context)
return redirect("Yomi:feed")


@login_required
def get_reply_form_unit(request):
if request.META.get("HTTP_HX_REQUEST"):
    return render(request, "partials/htmx/_reply_form_unit.html")
return redirect("Yomi:feed")


@login_required
def create_reply(request):
if request.method == "POST":
    content_list = request.POST.getlist("content")
image_count_list = request.POST.getlist("image_count")
image_list = request.FILES.getlist("reply_images")
Yomi_id = request.POST.get("Yomi_id")
comment_id = request.POST.get("comment_id")

Yomi = get_object_or_404(Yomi, pk = Yomi_id)
parent_comment = None
if comment_id:
    parent_comment = get_object_or_404(Comment, pk = comment_id)

        # Ensure thred content and Yomi images are not both empty.
if len(content_list[0]) == 0 and int(image_count_list[0]) == 0:
messages.warning(
    request, "You have to provide some content to create reply."
)
return redirect("Yomi:feed")
        # One comment case
cmt = create_cmt(
    content = content_list[0],
    user = request.user,
    Yomi = Yomi,
    parent_comment = parent_comment,
)
create_cmt_images(
    image_list = image_list[: int(image_count_list[0])], comment = cmt
)
        # More than one comment case
if len(content_list) > 1:
    i = 1
while i < len(content_list):
    child_cmt = create_cmt(
        content = content_list[i],
        user = request.user,
        Yomi = Yomi,
        parent_comment = cmt,
    )
left = 0
for j in range(i):
    left += int(image_count_list[j])
right = left + int(image_count_list[i])
create_cmt_images(image_list = image_list[left: right], comment = child_cmt)
i += 1

messages.success(request, "Reply created successfully.")

if parent_comment:
    return redirect(
        "Yomi:get_reply",
        username = parent_comment.user.username,
        id = int(comment_id),
    )
else:
return redirect(
    "Yomi:get_Yomi", username = Yomi.user.username, id = int(Yomi_id)
)

return redirect("Yomi:feed")


@login_required
def get_Yomi(request, username, id):
Yomi = get_object_or_404(Yomi, pk = id)
direct_comments = Comment.objects.filter(Yomi = Yomi, parent_comment = None)

paginator = Paginator(direct_comments, 7)
page_num = request.GET.get("page") or 1

try:
page_obj = paginator.page(page_num)
    except PageNotAnInteger:
page_num = 1
    except EmptyPage:
page_num = 1

page_obj = paginator.page(page_num)
context = { "Yomi": Yomi, "direct_comments": page_obj }
if request.META.get("HTTP_HX_REQUEST") and int(page_num) > 1:
return render(
    request,
    "Yomi/htmx/partials/_more_comment_section_for_Yomi_page.html",
    context,
)
if request.META.get("HTTP_HX_REQUEST"):
    return render(request, "Yomi/htmx/Yomi_page.html", context)
return render(request, "Yomi/f_Yomi_page.html", context)


@login_required
def get_reply(request, username, id):
comment = get_object_or_404(Comment, pk = id)
sub_comments = Comment.objects.filter(parent_comment = comment, Yomi = comment.Yomi)

paginator = Paginator(sub_comments, 7)
page_num = request.GET.get("page") or 1

try:
page_obj = paginator.page(page_num)
    except PageNotAnInteger:
page_num = 1
    except EmptyPage:
page_num = 1

page_obj = paginator.page(page_num)
context = { "comment": comment, "sub_comments": page_obj }
if request.META.get("HTTP_HX_REQUEST") and int(page_num) > 1:
return render(
    request,
    "Yomi/htmx/partials/_more_comment_section_for_reply_page.html",
    context,
)
if request.META.get("HTTP_HX_REQUEST"):
    return render(request, "Yomi/htmx/reply_page.html", context)
return render(request, "Yomi/f_reply_page.html", context)


@login_required
def like_Yomi_toggle(request, id):
if request.method == "POST" and request.META.get("HTTP_HX_REQUEST"):
Yomi = get_object_or_404(Yomi, pk = id)
try:
like_obj = Like.objects.get(Yomi = Yomi, user = request.user)
like_obj.delete()
        except Like.DoesNotExist:
Like.objects.create(Yomi = Yomi, user = request.user)
return HttpResponse("Success!")
return redirect("Yomi:feed")


@login_required
def like_comment_toggle(request, id):
if request.method == "POST" and request.META.get("HTTP_HX_REQUEST"):
comment = get_object_or_404(Comment, pk = id)
try:
like_cmt_obj = LikeComment.objects.get(comment = comment, user = request.user)
like_cmt_obj.delete()
        except LikeComment.DoesNotExist:
LikeComment.objects.create(comment = comment, user = request.user)
return HttpResponse("Success!")
return redirect("Yomi:feed")


@login_required
def search(request):
users = User.objects.all().order_by("-date_joined")

    # Annotate each user with a flag indicating whether the authenticated user is following them
for user in users:
    user.is_followed_by_authenticated_user = Follow.objects.filter(
        follower = request.user, followed = user
    ).exists()

paginator = Paginator(users, 10)
page_num = request.GET.get("page") or 1

try:
page_obj = paginator.page(page_num)
    except PageNotAnInteger:
page_num = 1
    except EmptyPage:
page_num = 1

page_obj = paginator.page(page_num)

if request.META.get("HTTP_HX_REQUEST") and int(page_num) > 1:
return render(
    request,
    "Yomi/htmx/partials/_more_search.html",
    { "page_obj": page_obj },
)

if request.META.get("HTTP_HX_REQUEST"):
    return render(request, "Yomi/htmx/search.html", { "page_obj": page_obj })
return render(request, "Yomi/f_search.html", { "page_obj": page_obj })


@login_required
def search_query(request):
if request.method == "POST" and request.META.get("HTTP_HX_REQUEST"):
q = request.POST.get("search")
users = User.objects.filter(username__icontains = q).order_by("-date_joined")

        # Annotate each user with a flag indicating whether the authenticated user is following them
for user in users:
    user.is_followed_by_authenticated_user = Follow.objects.filter(
        follower = request.user, followed = user
    ).exists()

paginator = Paginator(users, 10)
page_num = request.GET.get("page") or 1

try:
page_obj = paginator.page(page_num)
        except PageNotAnInteger:
page_num = 1
        except EmptyPage:
page_num = 1

page_obj = paginator.page(page_num)

return render(
    request,
    "Yomi/htmx/partials/_search_query.html",
    { "page_obj": page_obj },
)
    else:
return redirect("Yomi:search")


@login_required
def repost_Yomi_toggle(request, id):
if request.method == "POST" and request.META.get("HTTP_HX_REQUEST"):
Yomi = get_object_or_404(Yomi, pk = id)
try:
repost_obj = Repost.objects.get(Yomi = Yomi, user = request.user)
repost_obj.delete()
messages.success(request, "Tale repost deleted.")
        except Repost.DoesNotExist:
Repost.objects.create(Yomi = Yomi, user = request.user)
messages.success(request, "Tale reposted.")
return render(request, "htmx/partials/_notification_messages.html")
return redirect("Yomi:feed")


@login_required
def repost_comment_toggle(request, id):
if request.method == "POST" and request.META.get("HTTP_HX_REQUEST"):
comment = get_object_or_404(Comment, pk = id)
try:
repost_cmt_obj = RepostComment.objects.get(
    comment = comment, user = request.user
)
repost_cmt_obj.delete()
messages.success(request, "Comment repost deleted.")
        except RepostComment.DoesNotExist:
RepostComment.objects.create(comment = comment, user = request.user)
messages.success(request, "Comment reposted.")
return render(request, "htmx/partials/_notification_messages.html")
return redirect("Yomi:feed")


@login_required
def get_Yomi_likes(request, username, id):
Yomi = get_object_or_404(Yomi, pk = id)
likes = Like.objects.filter(Yomi = Yomi)
liked_users = [l.user for l in likes]

    # Annotate each user with a flag indicating whether the authenticated user is following them
for user in liked_users:
    user.is_followed_by_authenticated_user = Follow.objects.filter(
        follower = request.user, followed = user
    ).exists()

paginator = Paginator(liked_users, 15)
page_num = request.GET.get("page") or 1

try:
page_obj = paginator.page(page_num)
    except PageNotAnInteger:
page_num = 1
    except EmptyPage:
page_num = 1

page_obj = paginator.page(page_num)
context = { "liked_users": page_obj, "Yomi": Yomi }

if request.META.get("HTTP_HX_REQUEST"):
    return render(request, "htmx/partials/_liked_users_of_Yomis.html", context)
return redirect("Yomi:feed")


@login_required
def get_reply_likes(request, username, id):
comment = get_object_or_404(Comment, pk = id)
likes_cmts = LikeComment.objects.filter(comment = comment)
liked_users = [l.user for l in likes_cmts]

    # Annotate each user with a flag indicating whether the authenticated user is following them
for user in liked_users:
    user.is_followed_by_authenticated_user = Follow.objects.filter(
        follower = request.user, followed = user
    ).exists()

paginator = Paginator(liked_users, 15)
page_num = request.GET.get("page") or 1

try:
page_obj = paginator.page(page_num)
    except PageNotAnInteger:
page_num = 1
    except EmptyPage:
page_num = 1

page_obj = paginator.page(page_num)
context = { "liked_users": page_obj, "comment": comment }

if request.META.get("HTTP_HX_REQUEST"):
    return render(request, "htmx/partials/_liked_users_of_cmts.html", context)
return redirect("Yomi:feed")


@login_required
def notification(request):
notifications = Notification.objects.filter(user = request.user)

paginator = Paginator(notifications, 15)
page_num = request.GET.get("page") or 1

try:
page_obj = paginator.page(page_num)
    except PageNotAnInteger:
page_num = 1
    except EmptyPage:
page_num = 1

page_obj = paginator.page(page_num)
    # Annotate
for n in page_obj:
    if Follow.objects.filter(follower = n.user, followed = n.actioner).exists():
        n.user.is_already_following = True
    else:
    n.user.is_already_following = False
        # mark is_read
n.is_read = True
n.save()

context = { "notifications": page_obj }
if request.META.get("HTTP_HX_REQUEST") and int(page_num) > 1:
return render(request, "Yomi/partials/_more_notification.html", context)
if request.META.get("HTTP_HX_REQUEST"):
    return render(request, "Yomi/partials/_notification.html", context)
return render(request, "Yomi/f_notification.html", context)


@login_required
def check_reddot(request):
reddot_exists = Notification.objects.filter(
    user = request.user, is_read = False
).exists()
if reddot_exists:
    return HttpResponse(
        "<span class='reddot'></span>"
    )
else:
return HttpResponse("<span></span>")