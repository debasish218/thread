# Generated by Django 4.2.4 on 2023-08-09 04:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('thread', '0001_initial'),
    ]

    operations = [
        migrations.DeleteModel(
            name='ImageThread',
        ),
        migrations.DeleteModel(
            name='TextThread',
        ),
        migrations.RemoveField(
            model_name='thread',
            name='content_type',
        ),
        migrations.RemoveField(
            model_name='thread',
            name='object_id',
        ),
        migrations.AddField(
            model_name='thread',
            name='content',
            field=models.TextField(default=''),
        ),
        migrations.AddField(
            model_name='thread',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='thread_images/'),
        ),
        migrations.AddConstraint(
            model_name='like',
            constraint=models.UniqueConstraint(fields=('user', 'thread'), name='unique_like'),
        ),
    ]