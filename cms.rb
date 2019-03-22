require "sinatra"
require "sinatra/reloader"
require "sinatra/content_for"
require "sinatra/json"
require "tilt/erubis"

configure do
  enable :sessions
  set :session_secret, 'secret'
  set :erb, :escape_html => true
end

root = File.expand_path('.')

get '/files' do
  @files = Dir.glob(root + '/data/*').map do |path|
    File.basename(path)
  end
  
  erb :files, layout: false
end

get '/' do
  @files = Dir.glob(root + '/data/*').map do |path|
    File.basename(path)
  end
  
  erb :files
end

get '/:filename' do
  file_path = root + '/data/' + params[:filename]
  
  if !File.exist?(file_path)
    session[:message] = "File '#{File.basename(file_path)}' does not exist."
    redirect '/'
  end
  
  file_type = File.extname(file_path).delete('.')
  response = { type: file_type, name: File.basename(file_path), body: File.read(file_path) }
  
  json response
end

def extract_contact_params
  contact_params = [:full_name, :email, :phone_number, :tags]
  params.select { |key, _| contact_params.include?(key.to_sym) }
end

post '/:filename/edit' do
  request.body.rewind
  request_payload = JSON.parse request.body.read
  
  file_path = root + '/data/' + params[:filename]
  body = request_payload["body"]
  
  if !File.exist?(file_path)
    session[:message] = "File '#{File.basename(file_path)}' does not exist."
    redirect '/'
  end
  
  File.write(file_path, body)
  
  file_type = File.extname(file_path).delete('.')
  response = { type: file_type, name: File.basename(file_path), body: File.read(file_path) }
  
  json response
end

post '/create' do
  request.body.rewind
  request_payload = JSON.parse request.body.read
  filename = request_payload['filename']
  body = request_payload['body']
  file_path = File.join(root + '/data/' + filename)
  
  File.write(file_path, body);
end

post '/:filename/delete' do
  file_path = root + '/data/' + params[:filename]
  File.delete(file_path);
end